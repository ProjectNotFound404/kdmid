import test from "node:test";
import assert from "node:assert/strict";
import { loadPeople, savePerson, deletePerson, importPeople, exportPeople } from "../extension/storage.js";
import { createBackup } from "../extension/backup.js";
import { createVaultService } from "../extension/vault-service.js";
import { deriveKey, decryptPeople, sessionLifetime } from "../extension/crypto-vault.js";
import { vaultApi, testPassword } from "./fixtures/vault-api.js";

const original = [{ id: "first", fam: "Тестов", im: "Тест", passnumber: "0123456789" }];

test("migration removes plaintext, preserves people, and stores the key only in session memory", async () => {
  const fixture = vaultApi(original);
  globalThis.chrome = fixture.api;
  try {
    assert.deepEqual(await fixture.execute("status"), { setup: true, legacy: true });
    await fixture.execute("setup", { password: testPassword });
    assert.equal(fixture.local.people, null);
    assert.doesNotMatch(JSON.stringify(fixture.local), /Тестов|0123456789|test vault password|raw/);
    assert.equal((await loadPeople())[0].passnumber, "0123456789");
    const second = await savePerson({ fam: "Другая", im: "Тест" });
    await savePerson({ ...original[0], im: "Новое имя" });
    assert.equal((await loadPeople()).length, 2);
    await deletePerson(second.id);
    assert.equal((await loadPeople())[0].im, "Новое имя");
    assert.ok(fixture.levels.every((level) => level.accessLevel === "TRUSTED_CONTEXTS"));
    await fixture.execute("lock");
    assert.deepEqual(fixture.session, {});
    await assert.rejects(loadPeople(), /заблокировано/);
    await assert.rejects(fixture.execute("unlock", { password: "wrong" }), /Неверный пароль/);
    await fixture.execute("unlock", { password: testPassword });
    assert.equal((await loadPeople())[0].im, "Новое имя");
  } finally { delete globalThis.chrome; }
});

test("failed migration and invalid passwords leave legacy data untouched", async () => {
  const fixture = vaultApi(original);
  await assert.rejects(fixture.execute("setup", { password: "short" }), /12/);
  assert.equal(fixture.writes, 0);
  fixture.failWrites();
  await assert.rejects(fixture.execute("setup", { password: testPassword }), /QUOTA/);
  assert.deepEqual(fixture.local.people, original);
  assert.equal(fixture.local.vault, undefined);
  assert.deepEqual(fixture.session, {});
});

test("worker restarts preserve unlock until expiry, browser restart locks, concurrent saves preserve both people", async () => {
  let now = Date.now();
  const fixture = vaultApi([], () => now);
  await fixture.execute("setup", { password: testPassword });
  const restarted = createVaultService(fixture.api, () => now);
  assert.deepEqual(await restarted("status"), { unlocked: true });
  await Promise.all([restarted("save", { person: { fam: "Первый", im: "Тест" } }), restarted("save", { person: { fam: "Второй", im: "Тест" } })]);
  assert.equal((await restarted("load")).length, 2);
  now += sessionLifetime + 1;
  await restarted("expire");
  assert.deepEqual(fixture.session, {});
  await assert.rejects(restarted("load"), /заблокировано/);
  await restarted("unlock", { password: testPassword });
  delete fixture.session.vaultSession;
  assert.deepEqual(await createVaultService(fixture.api, () => now)("status"), { unlocked: false });
});

test("encrypted exports round trip with their password and import never replaces existing profiles", async () => {
  const fixture = vaultApi(original);
  globalThis.chrome = fixture.api;
  try {
    await fixture.execute("setup", { password: testPassword });
    const text = await exportPeople();
    assert.doesNotMatch(text, /Тестов|0123456789/);
    const backup = JSON.parse(text);
    const decrypted = await decryptPeople(backup, await deriveKey(testPassword, backup.salt));
    assert.equal(decrypted[0].passnumber, "0123456789");
    await assert.rejects(importPeople(text, "wrong"), /Неверный пароль/);
    assert.deepEqual(await importPeople(text, testPassword), { added: 0, skipped: 1 });
    const other = vaultApi([{ ...original[0], im: "Другой" }]);
    await other.execute("setup", { password: "different vault password" });
    assert.deepEqual(await other.execute("import", { text, password: testPassword }), { added: 1, skipped: 0 });
    const people = await other.execute("load");
    assert.equal(people.length, 2);
    assert.equal(people[0].im, "Другой");
    assert.notEqual(people[0].id, people[1].id);
  } finally { delete globalThis.chrome; }
});

test("tampering, malformed imports, and quota failures never change the vault", async () => {
  const fixture = vaultApi(original);
  await fixture.execute("setup", { password: testPassword });
  const snapshot = structuredClone(fixture.local.vault);
  const tampered = structuredClone(snapshot);
  tampered.data = `${tampered.data[0] === "A" ? "B" : "A"}${tampered.data.slice(1)}`;
  await assert.rejects(fixture.execute("import", { text: JSON.stringify(tampered), password: testPassword }), /Неверный пароль/);
  const incoming = JSON.parse(createBackup([{ id: "new", fam: "Новый", im: "Тест" }]));
  incoming.people.push({ id: "invalid", birth: "2025-02-29" });
  await assert.rejects(fixture.execute("import", { text: JSON.stringify(incoming) }));
  assert.deepEqual(fixture.local.vault, snapshot);
  fixture.failWrites();
  await assert.rejects(fixture.execute("import", { text: createBackup([{ id: "new", fam: "Новый", im: "Тест" }]) }), /QUOTA/);
  assert.deepEqual(fixture.local.vault, snapshot);
});

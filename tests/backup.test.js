import test from "node:test";
import assert from "node:assert/strict";
import { createBackup, readBackup, mergePeople, maxBackupBytes } from "../extension/backup.js";
import { normalizePerson } from "../extension/profiles.js";
import { importPeople, loadPeople } from "../extension/storage.js";

const person = (id, changes = {}) => ({ id, ...normalizePerson({ fam: "Тестов", im: "Тест", sex: "M", passcode: "dt_22", passnumber: "0000000", ...changes }) });

test("backup round trip preserves leading zeros, dates, Unicode and absence flags", () => {
  const people = [person("first", { birth: "1990-01-02", passseries: "00", noPatronymic: true, address: "Тестовый адрес" }), person("second", { passcode: "dt_10", citizenship: "АВСТРИЯ", noSeries: true })];
  const text = createBackup(people, "2026-10-09T00:00:00.000Z");
  assert.deepEqual(readBackup(text), people);
  assert.deepEqual(readBackup(`\uFEFF${text}`), people);
  assert.equal(JSON.parse(text).version, 1);
});

test("export includes only person fields, not arbitrary stored secrets or page actions", () => {
  const [restored] = readBackup(createBackup([{ ...person("first"), pass: "placeholder", role: "доверитель", prs: true, arbitrary: "extra" }]));
  for (const key of ["pass", "role", "prs", "arbitrary"]) assert.equal(Object.hasOwn(restored, key), false);
});

test("import keeps existing records, copies conflicting identifiers, and is repeatable without duplicates", () => {
  const existing = [person("same-id", { im: "Исходное имя" })];
  const incoming = [person("same-id", { im: "Новое имя" }), person("other-id", { im: "Третье имя" })];
  const result = mergePeople(existing, incoming);
  assert.deepEqual(result.people[0], existing[0]);
  assert.equal(result.added, 2);
  assert.equal(result.people[1].im, "Новое имя");
  assert.notEqual(result.people[1].id, "same-id");
  assert.equal(new Set(result.people.map((item) => item.id)).size, 3);
  assert.deepEqual(existing, [person("same-id", { im: "Исходное имя" })]);
  const repeated = mergePeople(result.people, incoming);
  assert.equal(repeated.added, 0);
  assert.equal(repeated.skipped, 2);
  assert.deepEqual(repeated.people, result.people);
});

test("identical profiles from a different installation are skipped", () => {
  const result = mergePeople([person("existing-id")], [person("different-id")]);
  assert.equal(result.added, 0);
  assert.equal(result.skipped, 1);
  assert.equal(result.people[0].id, "existing-id");
});

test("malformed files, unsupported schema and duplicate identifiers are rejected", () => {
  const wrapper = (people, version = 1) => JSON.stringify({ format: "kdmid-person-profiles", version, people });
  for (const text of ["not JSON", "null", "[]", '{"people":[]}', wrapper([], 2), wrapper([person("id"), person("id")]), wrapper([{ ...person("id"), birth: "2025-02-29" }]), wrapper([{ ...person("id"), noPatronymic: "true" }]), wrapper([{ ...person("id"), id: "" }]), wrapper([{ ...person("id"), address: {} }])]) {
    assert.throws(() => readBackup(text));
  }
  assert.throws(() => readBackup(" ".repeat(maxBackupBytes + 1)));
  assert.throws(() => createBackup(Array.from({ length: 1001 }, (_, index) => person(`id-${index}`))));
});

test("a late invalid record does not write or remove any existing people", async () => {
  const original = [person("existing")];
  let stored = structuredClone(original);
  let writes = 0;
  globalThis.chrome = { storage: { local: {
    async setAccessLevel() {},
    async get() { return { people: structuredClone(stored) }; },
    async set(values) { writes++; stored = structuredClone(values.people); },
  } } };
  try {
    const valid = JSON.parse(createBackup([person("incoming", { im: "Новое имя" })]));
    valid.people.push({ ...person("invalid"), sex: "invalid" });
    await assert.rejects(importPeople(JSON.stringify(valid)));
    assert.equal(writes, 0);
    assert.deepEqual(stored, original);
    const emptyResult = await importPeople(createBackup([]));
    assert.deepEqual(emptyResult, { added: 0, skipped: 0 });
    assert.deepEqual(stored, original);
    await importPeople(createBackup([person("incoming", { im: "Новое имя" })]));
    assert.equal(writes, 1);
    assert.equal((await loadPeople()).length, 2);
    assert.deepEqual(stored[0], original[0]);
  } finally { delete globalThis.chrome; }
});

test("storage quota errors preserve the original people", async () => {
  const original = [person("existing")];
  globalThis.chrome = { storage: { local: {
    async setAccessLevel() {},
    async get() { return { people: structuredClone(original) }; },
    async set() { throw new Error("QUOTA_BYTES"); },
  } } };
  try {
    await assert.rejects(importPeople(createBackup([person("incoming", { im: "Новое имя" })])), /QUOTA_BYTES/);
    assert.deepEqual(await loadPeople(), original);
  } finally { delete globalThis.chrome; }
});

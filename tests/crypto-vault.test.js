import test from "node:test";
import assert from "node:assert/strict";
import { newVault, encryptPeople, decryptPeople, parseVault } from "../extension/crypto-vault.js";

test("every vault has a random salt and every write a new nonce; metadata tampering is rejected", async () => {
  const people = [{ id: "test", fam: "Тестов", im: "Тест", passnumber: "0000123" }];
  const first = await newVault(people, "long test password");
  const second = await newVault(people, "long test password");
  assert.notEqual(first.vault.salt, second.vault.salt);
  const changed = await encryptPeople(people, first.raw, first.vault.salt);
  assert.notEqual(changed.iv, first.vault.iv);
  assert.notEqual(changed.data, first.vault.data);
  assert.equal((await decryptPeople(changed, first.raw))[0].passnumber, "0000123");
  for (const modification of [{ version: 2 }, { iterations: 1 }, { cipher: "AES-CBC" }, { iv: "AA==" }, { salt: "invalid" }, { data: "!" }]) {
    assert.throws(() => parseVault({ ...changed, ...modification }));
  }
  await assert.rejects(decryptPeople({ ...changed, iv: second.vault.iv }, first.raw), /Неверный пароль/);
});

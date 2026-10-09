import test from "node:test";
import assert from "node:assert/strict";
import { loadPeople, savePerson, deletePerson } from "../extension/storage.js";

test("people survive reopening, updates keep other profiles, and access is limited to trusted contexts", async () => {
  const data = {};
  const levels = [];
  globalThis.chrome = { storage: { local: {
    async get(key) { return structuredClone({ [key]: data[key] }); },
    async set(values) { Object.assign(data, structuredClone(values)); },
    async setAccessLevel(level) { levels.push(level); },
  } } };
  try {
    const first = await savePerson({ fam: "Тестов", im: "Тест", role: "поверенный" });
    const second = await savePerson({ fam: "Другая", im: "Тест" });
    assert.equal((await loadPeople()).length, 2);
    await savePerson({ ...first, im: "Новое имя" });
    const reopened = await loadPeople();
    assert.equal(reopened.find((person) => person.id === first.id).im, "Новое имя");
    assert.equal(reopened.find((person) => person.id === second.id).fam, "Другая");
    assert.equal(Object.hasOwn(reopened[0], "role"), false);
    await deletePerson(first.id);
    assert.equal((await loadPeople())[0].id, second.id);
    assert.ok(levels.every((level) => level.accessLevel === "TRUSTED_CONTEXTS"));
  } finally { delete globalThis.chrome; }
});

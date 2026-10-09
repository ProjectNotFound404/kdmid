import test from "node:test";
import assert from "node:assert/strict";
import { normalizePerson, personName } from "../extension/profiles.js";

test("profiles exclude portal roles, credentials, and arbitrary selectors", () => {
  const person = normalizePerson({ fam: " Тестов ", im: "Тест", role: "поверенный", pass: "secret", selector: "#pass", prs: true });
  assert.equal(person.fam, "Тестов");
  assert.equal(personName(person), "Тестов Тест");
  for (const key of ["role", "pass", "selector", "prs"]) assert.equal(Object.hasOwn(person, key), false);
});

test("invalid calendar dates and unexpected control values are rejected", () => {
  for (const input of [{ birth: "2025-02-29" }, { birth: "not a date" }, { sex: "other" }, { passcode: "script" }, { address: {} }, null, []]) {
    assert.throws(() => normalizePerson(input));
  }
  assert.equal(normalizePerson({ birth: "2024-02-29" }).birth, "2024-02-29");
});

test("explicit absent patronymic / series removes contradictory saved text", () => {
  const person = normalizePerson({ noPatronymic: true, ot: "Отчество", noSeries: true, passseries: "12" });
  assert.equal(person.ot, "");
  assert.equal(person.passseries, "");
  assert.equal(normalizePerson({ noPatronymic: "false" }).noPatronymic, false);
});

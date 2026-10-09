import test from "node:test";
import assert from "node:assert/strict";
import { addressCountries, findAddressCountry } from "../extension/countries.js";
import { normalizePerson } from "../extension/profiles.js";
import { createBackup, readBackup } from "../extension/backup.js";

test("country spelling and order match the address dropdown captured from the portal", () => {
  const text = JSON.stringify(addressCountries);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  assert.equal(addressCountries.length, 205);
  assert.equal(new Set(addressCountries).size, 205);
  assert.equal(hash.toString(16), "5b16941e");
});

test("case-insensitive matching returns only exact portal country values", () => {
  assert.equal(findAddressCountry(" АвСтРиЯ "), "АВСТРИЯ");
  assert.equal(findAddressCountry("белоруссия (беларусь)"), "БЕЛОРУССИЯ (БЕЛАРУСЬ)");
  assert.equal(findAddressCountry("кот-д`ивуар"), "КОТ-Д`ИВУАР");
  assert.equal(findAddressCountry("папуа — новая гвинея"), "ПАПУА — НОВАЯ ГВИНЕЯ");
  assert.equal(findAddressCountry("Авс"), undefined);
  assert.equal(findAddressCountry("Россия"), undefined);
});

test("old country capitalization is normalized and unknown legacy values survive backup", () => {
  assert.equal(normalizePerson({ country: "Австрия" }).country, "АВСТРИЯ");
  const legacy = { id: "legacy", ...normalizePerson({ country: "Россия" }) };
  assert.equal(readBackup(createBackup([legacy]))[0].country, "Россия");
});

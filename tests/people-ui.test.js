import { vaultApi, testPassword } from "./fixtures/vault-api.js";
import { decryptPeople, deriveKey } from "../extension/crypto-vault.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { fields, normalizePerson, personName } from "../extension/profiles.js";
import { loadPeople, savePerson, deletePerson, importPeople, exportPeople } from "../extension/storage.js";
import { createBackup, maxBackupBytes } from "../extension/backup.js";
import { addressCountries, findAddressCountry } from "../extension/countries.js";
import { attachCountryPicker } from "../extension/country-picker.js";

const initial = () => ({ id: "existing", ...normalizePerson({ fam: "Тестов", im: "Тест", sex: "M", passcode: "dt_22", passnumber: "0000000" }) });
const flush = async () => { for (let i = 0; i < 4; i++) await new Promise((resolve) => setTimeout(resolve, 0)); };

async function editor(people = [initial()]) {
  const fixture = vaultApi(people);
  const data = fixture.local;
  globalThis.chrome = fixture.api;
  await fixture.execute("setup", { password: testPassword });
  const attachVaultGate = async (content, ready) => { content.hidden = false; await ready(); };
  const dom = new JSDOM(readFileSync("extension/people.html", "utf8"), { url: "https://extension-test.invalid/people.html", runScripts: "outside-only" });
  const { window } = dom;
  Object.assign(window, { fields, normalizePerson, personName, loadPeople, savePerson, deletePerson, importPeople, exportPeople, attachVaultGate, createBackup, maxBackupBytes, addressCountries, findAddressCountry, attachCountryPicker, Blob });
  let downloaded;
  window.URL.createObjectURL = (blob) => { downloaded = { blob }; return "blob:local-test"; };
  window.URL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = function () { downloaded.filename = this.download; };
  const source = readFileSync("extension/people.js", "utf8").replace(/^import .*;\n/gm, "");
  window.eval(source);
  await flush();
  return { dom, data, fixture, download: () => downloaded };
}

test("export button downloads saved profiles while leaving unsaved edits intact", async () => {
  const page = await editor();
  const { document, Event } = page.dom.window;
  try {
    document.getElementById("fam").value = "Несохранённое имя";
    document.getElementById("fam").dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("export").click();
    await page.fixture.execute("status");
    await flush();
    const download = page.download();
    assert.match(download.filename, /^kdmid-people-\d{4}-\d{2}-\d{2}\.json$/);
    const backup = JSON.parse(await download.blob.text());
    assert.deepEqual(await decryptPeople(backup, await deriveKey(testPassword, backup.salt)), [initial()]);
    assert.equal(document.getElementById("fam").value, "Несохранённое имя");
    assert.match(document.getElementById("backup-status").textContent, /Несохранённые изменения/);
    assert.equal(document.getElementById("export").disabled, false);
  } finally { page.dom.window.close(); delete globalThis.chrome; }
});

test("file picker import updates the list, keeps the editor, and reports malformed files", async () => {
  const page = await editor();
  const { document, Event } = page.dom.window;
  try {
    const name = document.getElementById("fam");
    name.value = "Несохранённое имя";
    name.dispatchEvent(new Event("input", { bubbles: true }));
    const input = document.getElementById("import-file");
    const text = createBackup([{ id: "imported", ...normalizePerson({ fam: "Другой", im: "Тест" }) }]);
    const choose = async (contents) => {
      Object.defineProperty(input, "files", { configurable: true, value: [{ size: contents.length, async text() { return contents; } }] });
      input.dispatchEvent(new Event("change"));
      await page.fixture.execute("status");
      await flush();
    };
    await choose(text);
    assert.equal((await page.fixture.execute("load")).length, 2);
    assert.match(document.getElementById("list").textContent, /Другой Тест/);
    assert.equal(name.value, "Несохранённое имя");
    assert.match(document.getElementById("backup-status").textContent, /Добавлено людей: 1/);
    await choose(text);
    assert.equal((await page.fixture.execute("load")).length, 2);
    assert.match(document.getElementById("backup-status").textContent, /пропущено: 1/);
    await choose("not JSON");
    assert.equal((await page.fixture.execute("load")).length, 2);
    assert.equal(document.getElementById("backup-status").className, "error");
    assert.equal(document.getElementById("import").disabled, false);
  } finally { page.dom.window.close(); delete globalThis.chrome; }
});

test("country suggestions match the portal and saving requires a valid selection", async () => {
  const page = await editor();
  const { document, Event } = page.dom.window;
  try {
    document.querySelector("#list .person").click();
    const control = document.getElementById("country");
    assert.equal(control.getAttribute("role"), "combobox");
    control.focus();
    const options = Array.from(document.querySelectorAll('#country-options [role="option"]'));
    assert.deepEqual(options.map((option) => option.textContent), [...addressCountries]);
    control.value = "Авс";
    control.dispatchEvent(new Event("input", { bubbles: true }));
    assert.equal(control.checkValidity(), false);
    document.getElementById("save").click();
    await page.fixture.execute("status");
    await flush();
    assert.equal((await page.fixture.execute("load"))[0].country, "");
    control.value = "Австрия";
    control.dispatchEvent(new Event("change", { bubbles: true }));
    assert.equal(control.value, "АВСТРИЯ");
    assert.equal(control.checkValidity(), true);
    document.getElementById("save").click();
    await page.fixture.execute("status");
    await flush();
    assert.equal((await page.fixture.execute("load"))[0].country, "АВСТРИЯ");
  } finally { page.dom.window.close(); delete globalThis.chrome; }
});

test("legacy country text remains accessible without losing the saved person", async () => {
  const page = await editor([{ ...initial(), country: "Россия" }]);
  const { document } = page.dom.window;
  try {
    document.querySelector("#list .person").click();
    assert.equal(document.getElementById("country").value, "Россия");
    assert.equal(document.getElementById("country").checkValidity(), false);
    assert.equal((await page.fixture.execute("load")).length, 1);
    assert.equal((await page.fixture.execute("load"))[0].country, "Россия");
  } finally { page.dom.window.close(); delete globalThis.chrome; }
});

test("country search filters without changing portal order and keyboard selection commits a value", async () => {
  const page = await editor();
  const { document, Event, KeyboardEvent } = page.dom.window;
  try {
    const control = document.getElementById("country");
    control.focus();
    control.value = "авс";
    control.dispatchEvent(new Event("input", { bubbles: true }));
    assert.deepEqual(Array.from(document.querySelectorAll('#country-options [role="option"]'), (option) => option.textContent), ["АВСТРАЛИЯ", "АВСТРИЯ"]);
    control.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    control.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    assert.equal(control.value, "АВСТРИЯ");
    assert.equal(control.checkValidity(), true);
    assert.equal(control.getAttribute("aria-expanded"), "false");
    document.querySelector(".country-toggle").click();
    assert.equal(document.querySelectorAll('#country-options [role="option"]').length, 205);
    control.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    assert.equal(control.getAttribute("aria-expanded"), "false");
    assert.equal(control.value, "АВСТРИЯ");
  } finally { page.dom.window.close(); delete globalThis.chrome; }
});

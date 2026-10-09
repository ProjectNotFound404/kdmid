import test from "node:test";
import assert from "node:assert/strict";
import { portal, sample } from "./fixtures/portal.js";

test("fills dependent fields and delayed dates while preserving the chosen participant role", async () => {
  const page = portal({ role: "поверенный" });
  try {
    const result = await page.fill({ ...sample, role: "доверитель", pass: "malicious", prs: true, actor: "malicious" });
    assert.deepEqual(Array.from(result.failed), []);
    assert.equal(page.value("fam"), sample.fam);
    assert.equal(page.value("sex"), "F");
    assert.equal(page.value("birth"), "19900102");
    assert.equal(page.value("passissuedate"), "20200304");
    assert.equal(page.value("address"), sample.address);
    assert.equal(page.value("snils"), "000-000-000 00");
    assert.equal(page.value("role"), "поверенный");
    assert.equal(page.value("actor"), "untouched");
    assert.equal(page.value("pass"), "untouched");
    assert.equal(page.value("fnumber"), "untouched");
    assert.equal(page.document.getElementById("prs").checked, false);
    assert.equal(page.value("document-text"), "untouched");
    assert.equal(page.added(), 0);
  } finally { page.dom.window.close(); }
});

test("refuses another origin or a hidden person form without changes", async () => {
  for (const options of [{ url: "https://example.com/" }, { visible: false }, { url: "http://notary.kdmid.ru/" }, { url: "https://notary.kdmid.ru.example.com/" }]) {
    const page = portal(options);
    try {
      assert.ok((await page.fill(sample)).error);
      assert.equal(page.value("fam"), "");
      assert.equal(page.value("sex"), "");
    } finally { page.dom.window.close(); }
  }
});

test("conflicts are reported before any mutation", async () => {
  const page = portal();
  try {
    page.set("fam", "Другой человек");
    const result = await page.fill(sample);
    assert.ok(result.conflicts.includes("Фамилия"));
    assert.equal(page.value("sex"), "");
    assert.equal(page.value("passcode"), "");
    assert.equal(page.value("fam"), "Другой человек");
  } finally { page.dom.window.close(); }
});

test("confirmed replacement clears old optional details rather than mixing profiles", async () => {
  const page = portal();
  try {
    await page.fill(sample);
    const next = { ...sample, fam: "Другая", note: "", inn: "", snils: "", address: "", birth: "", passissuedate: "" };
    const conflicts = await page.fill(next);
    assert.ok(conflicts.conflicts.includes("Примечание"));
    const result = await page.fill(next, true);
    assert.deepEqual(Array.from(result.failed), []);
    for (const id of ["note", "inn", "snils", "address", "birth", "passissuedate"]) assert.equal(page.value(id), "");
    assert.equal(page.value("fam"), "Другая");
    assert.equal(page.value("role"), "поверенный");
  } finally { page.dom.window.close(); }
});

test("foreign document supports Latin names and explicit absence of patronymic / series", async () => {
  const page = portal();
  try {
    const result = await page.fill({ ...sample, passcode: "dt_10", citizenship: "АВСТРИЯ", namelat: "TEST PERSON", noPatronymic: true, noSeries: true, ot: "", passseries: "" });
    assert.deepEqual(Array.from(result.failed), []);
    assert.equal(page.value("namelat"), "TEST PERSON");
    assert.equal(page.value("citizenship"), "АВСТРИЯ");
    assert.equal(page.document.getElementById("ot.notvalue").checked, true);
    assert.equal(page.document.getElementById("passseries.notvalue").checked, true);
    assert.equal(page.value("ot"), "");
    assert.equal(page.value("passseries"), "");
  } finally { page.dom.window.close(); }
});

test("unknown country is reported and unrelated fields continue filling", async () => {
  const page = portal();
  try {
    const result = await page.fill({ ...sample, country: "Несуществующая страна" });
    assert.ok(result.failed.includes("Страна адреса"));
    assert.equal(page.value("country"), "");
    assert.equal(page.value("fam"), sample.fam);
    assert.equal(page.value("role"), "поверенный");
  } finally { page.dom.window.close(); }
});

test("unavailable document stops before inserting names into the wrong document form", async () => {
  const page = portal();
  try {
    const result = await page.fill({ ...sample, passcode: "unknown" });
    assert.ok(result.error);
    assert.equal(page.value("fam"), "");
    assert.equal(page.value("passnumber"), "");
  } finally { page.dom.window.close(); }
});

test("a hidden duplicate form is ignored and its details are preserved", async () => {
  const page = portal();
  try {
    const hidden = page.root.cloneNode(true);
    page.document.body.prepend(hidden);
    const result = await page.fill(sample);
    assert.deepEqual(Array.from(result.failed), []);
    assert.equal(hidden.querySelector("#fam").value, "");
    assert.equal(page.root.querySelector("#fam").value, sample.fam);
  } finally { page.dom.window.close(); }
});

test("initial data-disabled / data-view metadata does not override current enabled widget state", async () => {
  const page = portal();
  try {
    for (const id of ["fam", "im", "passseries", "passnumber", "passissuedate", "passissuer"]) {
      page.document.getElementById(id).dataset.disabled = "true";
    }
    page.document.getElementById("namelat").dataset.view = "false";
    const result = await page.fill({ ...sample, passcode: "dt_10", citizenship: "АВСТРИЯ", namelat: "TEST PERSON" });
    assert.deepEqual(Array.from(result.failed), []);
    assert.deepEqual(Array.from(result.skipped), []);
    assert.equal(page.value("fam"), sample.fam);
    assert.equal(page.value("passnumber"), sample.passnumber);
    assert.equal(page.value("passissuedate"), "20200304");
    assert.equal(page.value("namelat"), "TEST PERSON");
  } finally { page.dom.window.close(); }
});

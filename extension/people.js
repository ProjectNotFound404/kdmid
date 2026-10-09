import { fields, normalizePerson, personName } from "./profiles.js";
import { loadPeople, savePerson, deletePerson, importPeople } from "./storage.js";
import { createBackup, maxBackupBytes } from "./backup.js";
import { addressCountries, findAddressCountry } from "./countries.js";
import { attachCountryPicker } from "./country-picker.js";

const form = document.getElementById("editor");
const list = document.getElementById("list");
const status = document.getElementById("status");
const backupStatus = document.getElementById("backup-status");
let people = [];
let selectedId = null;
let dirty = false;
let busy = false;

for (const field of fields) {
  const row = document.createElement("div");
  row.className = "field";
  const label = document.createElement("label");
  label.htmlFor = field.key;
  label.textContent = field.label;
  const control = document.createElement(field.type === "textarea" ? "textarea" : field.type === "select" ? "select" : "input");
  control.id = field.key;
  control.name = field.key;
  if (control.tagName === "INPUT") control.type = field.type === "country" ? "text" : field.type || "text";
  if (control.tagName === "TEXTAREA") control.rows = 2;
  if (field.max) control.maxLength = field.max;
  if (field.options) {
    control.add(new Option("Выберите…", ""));
    for (const [value, text] of field.options) control.add(new Option(text, value));
  }
  if (["fam", "im", "sex", "passcode"].includes(field.key)) control.required = true;
  if (field.type === "date") {
    const today = new Date();
    control.max = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  }
  if (["inn", "snils"].includes(field.key)) control.inputMode = "numeric";
  if (field.type === "checkbox") { row.classList.add("checkbox"); row.append(control, label); }
  else row.append(label, control);
  if (field.type === "country") {
    control.placeholder = "Введите название или выберите страну";
    attachCountryPicker(control, addressCountries);
  }
  if (field.hint) {
    const hint = document.createElement("small");
    hint.id = `${field.key}-hint`;
    hint.textContent = field.hint;
    control.setAttribute("aria-describedby", hint.id);
    row.append(hint);
  }
  document.getElementById("fields").append(row);
}

function dependencies() {
  document.getElementById("ot").disabled = document.getElementById("noPatronymic").checked;
  const code = document.getElementById("passcode").value;
  const russian = ["dt_22", "dt_21", "dt_09", "dt_91"].includes(code);
  document.getElementById("citizenship").disabled = russian;
  if (russian) document.getElementById("citizenship").value = "РОССИЙСКАЯ ФЕДЕРАЦИЯ";
  document.getElementById("namelat").disabled = code !== "dt_10";
  document.getElementById("noSeries").disabled = russian;
  if (russian) document.getElementById("noSeries").checked = false;
  document.getElementById("passseries").disabled = document.getElementById("noSeries").checked;
}

function renderList() {
  list.replaceChildren();
  const query = document.getElementById("search").value.trim().toLocaleLowerCase("ru");
  const filtered = people.filter((person) => personName(person).toLocaleLowerCase("ru").includes(query));
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = people.length ? "Никого не найдено." : "Сохранённых людей пока нет.";
    list.append(empty);
  }
  for (const person of filtered) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "person";
    button.textContent = personName(person);
    button.setAttribute("aria-current", String(person.id === selectedId));
    button.addEventListener("click", () => {
      if (busy || (dirty && !confirm("Открыть другого человека без сохранения изменений?"))) return;
      edit(person);
    });
    list.append(button);
  }
}

function edit(person = {}) {
  selectedId = person.id || null;
  const values = normalizePerson(person);
  for (const field of fields) {
    const control = document.getElementById(field.key);
    if (field.type === "checkbox") control.checked = values[field.key];
    else control.value = values[field.key];
  }
  dependencies();
  validateCountry();
  document.getElementById("editor-title").textContent = selectedId ? personName(person) : "Новый человек";
  document.getElementById("delete").hidden = !selectedId;
  status.textContent = "";
  dirty = false;
  renderList();
}

form.addEventListener("input", () => { dirty = true; dependencies(); });
form.addEventListener("change", (event) => {
  if (event.target.id === "passcode" && !["dt_22", "dt_21", "dt_09", "dt_91"].includes(event.target.value) && document.getElementById("citizenship").value === "РОССИЙСКАЯ ФЕДЕРАЦИЯ") {
    document.getElementById("citizenship").value = "";
  }
  dirty = true;
  dependencies();
});
document.getElementById("search").addEventListener("input", renderList);
document.getElementById("new").addEventListener("click", () => {
  if (!busy && (!dirty || confirm("Начать новую запись без сохранения изменений?"))) edit();
});
window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });

async function persist(action) {
  if (busy) return;
  busy = true;
  document.getElementById("save").disabled = true;
  document.getElementById("delete").disabled = true;
  document.getElementById("export").disabled = true;
  document.getElementById("import").disabled = true;
  try { await action(); }
  catch (error) { status.textContent = error.message || "Не удалось сохранить данные."; status.className = "error"; }
  finally {
    busy = false;
    for (const id of ["save", "delete", "export", "import"]) document.getElementById(id).disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  validateCountry(true);
  if (!form.reportValidity()) return;
  persist(async () => {
    const values = {};
    for (const field of fields) {
      const control = document.getElementById(field.key);
      values[field.key] = field.type === "checkbox" ? control.checked : control.value;
    }
    const saved = await savePerson({ id: selectedId, ...values });
    people = await loadPeople();
    edit(saved);
    status.className = "";
    status.textContent = "Человек сохранён. Теперь его можно выбрать в расширении на портале.";
  });
});

function validateCountry(commit = false) {
  const control = document.getElementById("country");
  const country = findAddressCountry(control.value);
  control.setCustomValidity(control.value.trim() && !country ? "Выберите страну из списка портала." : "");
  if (commit && country) control.value = country;
}

document.getElementById("country").addEventListener("input", () => validateCountry());
document.getElementById("country").addEventListener("change", () => validateCountry(true));
document.getElementById("country").addEventListener("blur", () => validateCountry(true));

document.getElementById("delete").addEventListener("click", () => {
  if (!selectedId || busy || !confirm("Удалить этого человека из расширения?")) return;
  persist(async () => {
    await deletePerson(selectedId);
    people = await loadPeople();
    edit();
    status.className = "";
    status.textContent = "Человек удалён.";
  });
});

async function transfer(action) {
  if (busy) return;
  await persist(async () => {
    backupStatus.textContent = "";
    backupStatus.className = "";
    try { await action(); }
    catch (error) {
      backupStatus.textContent = error.message || "Не удалось обработать файл.";
      backupStatus.className = "error";
    }
  });
}

document.getElementById("export").addEventListener("click", () => transfer(async () => {
  const saved = await loadPeople();
  if (!saved.length) throw new Error("Пока нет сохранённых людей для экспорта.");
  const blob = new Blob([createBackup(saved)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kdmid-people-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  try { link.click(); }
  finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
  backupStatus.textContent = `Файл экспорта передан браузеру. Людей: ${saved.length}.${dirty ? " Несохранённые изменения в файл не включены." : ""}`;
}));

const importFile = document.getElementById("import-file");
document.getElementById("import").addEventListener("click", () => { if (!busy) importFile.click(); });
importFile.addEventListener("change", () => {
  const file = importFile.files[0];
  importFile.value = "";
  if (!file) return;
  transfer(async () => {
    if (file.size > maxBackupBytes) throw new Error("Файл слишком большой. Максимальный размер — 5 МБ.");
    const result = await importPeople(await file.text());
    people = await loadPeople();
    renderList();
    backupStatus.textContent = `Добавлено людей: ${result.added}. Совпадающих записей пропущено: ${result.skipped}. Существующие записи сохранены.`;
  });
});

loadPeople().then((saved) => { people = saved; edit(); }).catch(() => {
  status.textContent = "Не удалось загрузить сохранённых людей.";
  status.className = "error";
  for (const id of ["save", "export", "import"]) document.getElementById(id).disabled = true;
});

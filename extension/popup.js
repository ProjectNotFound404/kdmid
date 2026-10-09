import { attachVaultGate } from "./vault-ui.js";
import { fillPerson } from "./autofill.js";
import { loadPeople } from "./storage.js";
import { personName } from "./profiles.js";

const select = document.getElementById("person");
const fill = document.getElementById("fill");
const confirmation = document.getElementById("confirm");
const status = document.getElementById("status");
let people = [];
let tabId;
let busy = false;

function show(message, error = false) {
  status.textContent = message;
  status.className = error ? "error" : "";
}

async function apply(overwrite = false) {
  if (busy) return;
  const person = people.find((item) => item.id === select.value);
  if (!person || !tabId) return;
  busy = true;
  fill.disabled = true;
  select.disabled = true;
  confirmation.hidden = true;
  document.getElementById("replace").disabled = true;
  show("Заполняю поля…");
  try {
    const current = (await loadPeople()).find((item) => item.id === person.id);
    if (!current) throw new Error("Человек удалён. Откройте расширение снова.");
    await chrome.storage.local.set({ selectedPersonId: person.id });
    const results = await chrome.scripting.executeScript({ target: { tabId }, func: fillPerson, args: [current, overwrite] });
    const result = results[0]?.result;
    if (!result) throw new Error("Не удалось получить результат заполнения.");
    if (result.conflicts) {
      document.getElementById("conflicts").textContent = `В форме уже отличаются поля: ${result.conflicts.join(", ")}.`;
      confirmation.hidden = false;
      show("Подтвердите замену существующих данных.");
    } else if (result.error) {
      show(result.error, true);
    } else {
      const messages = [`Заполнено полей: ${result.filled.length}. Проверьте данные на портале.`];
      if (result.skipped.length) messages.push(`Недоступны в этой форме: ${result.skipped.join(", ")}.`);
      if (result.failed.length) messages.push(`Заполните вручную: ${result.failed.join(", ")}.`);
      show(messages.join(" "), result.failed.length > 0);
    }
  } catch {
    show("Не удалось заполнить форму. Откройте форму человека и снова нажмите значок расширения.", true);
  } finally {
    busy = false;
    fill.disabled = false;
    select.disabled = false;
    document.getElementById("replace").disabled = false;
  }
}

document.getElementById("manage").addEventListener("click", () => chrome.runtime.openOptionsPage());
fill.addEventListener("click", () => apply());
document.getElementById("replace").addEventListener("click", () => apply(true));
document.getElementById("cancel").addEventListener("click", () => { confirmation.hidden = true; show("Замена отменена."); });
select.addEventListener("change", () => { confirmation.hidden = true; show(""); });

async function init(current = () => true) {
  try {
    const saved = await loadPeople();
    if (!current()) return;
    people = saved;
    if (!people.length) {
      select.add(new Option("Пока нет сохранённых людей", ""));
      show("Откройте «Мои люди» и добавьте первого человека.");
      return;
    }
    for (const person of people) select.add(new Option(personName(person), person.id));
    select.disabled = false;
    const { selectedPersonId } = await chrome.storage.local.get("selectedPersonId");
    if (people.some((person) => person.id === selectedPersonId)) select.value = selectedPersonId;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || new URL(tab.url).origin !== "https://notary.kdmid.ru") {
      show("Откройте форму человека на notary.kdmid.ru.");
      return;
    }
    if (!current()) return;
    tabId = tab.id;
    fill.disabled = false;
  } catch {
    show("Не удалось загрузить данные. Попробуйте открыть расширение снова.", true);
  }
}

attachVaultGate(document.getElementById("vault-content"), init, () => {
  people = [];
  tabId = undefined;
  select.replaceChildren();
  select.disabled = true;
  fill.disabled = true;
  confirmation.hidden = true;
  status.textContent = "";
});

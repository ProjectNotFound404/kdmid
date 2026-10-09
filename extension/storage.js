import { normalizePerson } from "./profiles.js";
import { readBackup, mergePeople } from "./backup.js";

export async function loadPeople() {
  await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  const { people = [] } = await chrome.storage.local.get("people");
  if (!Array.isArray(people)) throw new Error("Не удалось прочитать сохранённых людей.");
  return people.map((item) => {
    if (typeof item.id !== "string") throw new Error("Повреждённый профиль человека.");
    return { id: item.id, ...normalizePerson(item) };
  });
}

export async function savePerson(person) {
  const people = await loadPeople();
  const saved = { id: person.id || crypto.randomUUID(), ...normalizePerson(person) };
  const index = people.findIndex((item) => item.id === saved.id);
  if (index === -1) people.push(saved);
  else people[index] = saved;
  await chrome.storage.local.set({ people });
  return saved;
}

export async function deletePerson(id) {
  const people = await loadPeople();
  await chrome.storage.local.set({ people: people.filter((item) => item.id !== id) });
}

export async function importPeople(text) {
  const incoming = readBackup(text);
  const existing = await loadPeople();
  const result = mergePeople(existing, incoming);
  if (result.added) await chrome.storage.local.set({ people: result.people });
  return { added: result.added, skipped: result.skipped };
}

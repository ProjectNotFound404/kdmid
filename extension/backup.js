import { fields, normalizePerson } from "./profiles.js";

export const maxBackupBytes = 5 * 1024 * 1024;

function backupPerson(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || typeof input.id !== "string" || !input.id.trim() || input.id.length > 128) {
    throw new Error("В файле есть некорректная запись человека.");
  }
  for (const field of fields) {
    if (field.type === "checkbox" && input[field.key] != null && typeof input[field.key] !== "boolean") {
      throw new Error(`Проверьте поле «${field.label}» в файле.`);
    }
  }
  return { id: input.id, ...normalizePerson(input) };
}

export function createBackup(people, exportedAt = new Date().toISOString()) {
  const text = JSON.stringify({
    format: "kdmid-person-profiles",
    version: 1,
    exportedAt,
    people: people.map(backupPerson),
  }, null, 2);
  readBackup(text);
  return text;
}

export function readBackup(text) {
  if (typeof text !== "string" || new TextEncoder().encode(text).length > maxBackupBytes) {
    throw new Error("Файл слишком большой. Максимальный размер — 5 МБ.");
  }
  let backup;
  try { backup = JSON.parse(text.replace(/^\uFEFF/, "")); }
  catch { throw new Error("Не удалось прочитать JSON. Выберите файл экспорта людей."); }
  if (!backup || backup.format !== "kdmid-person-profiles" || backup.version !== 1 || !Array.isArray(backup.people)) {
    throw new Error("Это не поддерживаемый файл экспорта людей.");
  }
  if (backup.people.length > 1000) throw new Error("В одном файле может быть не более 1000 людей.");
  const people = backup.people.map(backupPerson);
  if (new Set(people.map((person) => person.id)).size !== people.length) {
    throw new Error("В файле повторяются идентификаторы людей.");
  }
  return people;
}

export function mergePeople(existing, incoming) {
  const people = existing.map(backupPerson);
  const signatures = new Set(people.map((person) => JSON.stringify(normalizePerson(person))));
  const ids = new Set(people.map((person) => person.id));
  let added = 0;
  let skipped = 0;
  for (const item of incoming) {
    const person = backupPerson(item);
    const signature = JSON.stringify(normalizePerson(person));
    if (signatures.has(signature)) { skipped++; continue; }
    if (ids.has(person.id)) {
      do { person.id = crypto.randomUUID(); } while (ids.has(person.id));
    }
    people.push(person);
    signatures.add(signature);
    ids.add(person.id);
    added++;
  }
  return { people, added, skipped };
}

import { findAddressCountry } from "./countries.js";

export const documents = [
  ["dt_22", "Загранпаспорт гражданина Российской Федерации"],
  ["dt_21", "Паспорт гражданина Российской Федерации"],
  ["dt_10", "Паспорт иностранного гражданина"],
  ["dt_03", "Свидетельство о рождении"],
  ["dt_09", "Дипломатический паспорт"],
  ["dt_91", "Служебный паспорт"],
  ["dt_23", "Свидетельство о рождении иностранного государства"],
];

export const fields = [
  { key: "fam", label: "Фамилия", max: 30 },
  { key: "im", label: "Имя", max: 30 },
  { key: "ot", label: "Отчество", max: 30 },
  { key: "noPatronymic", label: "Нет отчества", type: "checkbox" },
  { key: "sex", label: "Пол", type: "select", options: [["M", "Мужской"], ["F", "Женский"]] },
  { key: "birth", label: "Дата рождения", type: "date" },
  { key: "birthplace", label: "Место рождения", max: 255 },
  { key: "passcode", label: "Документ, удостоверяющий личность", type: "select", options: documents },
  { key: "citizenship", label: "Гражданство", hint: "Название страны по-русски. Для паспорта РФ определяется автоматически." },
  { key: "namelat", label: "Фамилия и имена латиницей", hint: "Для иностранного документа." },
  { key: "passseries", label: "Серия документа" },
  { key: "noSeries", label: "Нет серии", type: "checkbox" },
  { key: "passnumber", label: "Номер документа" },
  { key: "passissuedate", label: "Дата выдачи", type: "date" },
  { key: "passissuer", label: "Кем выдан документ", type: "textarea" },
  { key: "country", label: "Страна адреса", type: "country", hint: "Начните вводить название и выберите страну из списка портала." },
  { key: "address", label: "Адрес", type: "textarea" },
  { key: "inn", label: "ИНН (при наличии)" },
  { key: "snils", label: "СНИЛС (при наличии)" },
  { key: "note", label: "Примечание", type: "textarea" },
];

export function normalizePerson(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Некорректные данные человека.");
  }
  const person = {};
  for (const field of fields) {
    const value = input[field.key];
    if (field.type === "checkbox") {
      person[field.key] = value === true;
    } else {
      if (value != null && typeof value !== "string") throw new Error(`Проверьте поле «${field.label}».`);
      person[field.key] = (value || "").trim();
      if (person[field.key].length > (field.max || 2000)) throw new Error(`Слишком длинное поле «${field.label}».`);
      if (field.options && person[field.key] && !field.options.some(([key]) => key === person[field.key])) {
        throw new Error(`Проверьте поле «${field.label}».`);
      }
      if (field.type === "date" && person[field.key]) {
        const date = person[field.key];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
          throw new Error(`Проверьте поле «${field.label}».`);
        }
      }
    }
  }
  if (person.noPatronymic) person.ot = "";
  person.country = findAddressCountry(person.country) || person.country;
  if (person.noSeries) person.passseries = "";
  if (["dt_22", "dt_21", "dt_09", "dt_91"].includes(person.passcode)) {
    person.citizenship = "РОССИЙСКАЯ ФЕДЕРАЦИЯ";
    person.namelat = "";
    person.noSeries = false;
  }
  return person;
}

export function personName(person) {
  return [person.fam, person.im, person.ot].filter(Boolean).join(" ") || "Без имени";
}

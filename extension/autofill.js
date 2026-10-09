export async function fillPerson(person, overwrite = false) {
  if (location.origin !== "https://notary.kdmid.ru") {
    return { error: "Откройте форму человека на notary.kdmid.ru." };
  }
  const roots = [...document.querySelectorAll('[id="allactors"]')].filter((root) => root.getClientRects().length && root.querySelector("#fam") && root.querySelector("#sex"));
  if (roots.length !== 1) {
    return { error: "Сначала выберите тип участника на портале и откройте форму человека." };
  }
  const root = roots[0];
  const find = (id) => [...root.querySelectorAll("input,textarea")].find((el) => el.id === id);
  const fieldIds = ["sex", "passcode", "citizenship", "fam", "im", "ot", "birth", "birthplace", "namelat", "passseries", "passnumber", "passissuedate", "passissuer", "country", "address", "inn", "snils", "note"];
  const texts = { sex: "Пол", passcode: "Тип документа", citizenship: "Гражданство", fam: "Фамилия", im: "Имя", ot: "Отчество", birth: "Дата рождения", birthplace: "Место рождения", namelat: "ФИО латиницей", passseries: "Серия", passnumber: "Номер документа", passissuedate: "Дата выдачи", passissuer: "Кем выдан", country: "Страна адреса", address: "Адрес", inn: "ИНН", snils: "СНИЛС", note: "Примечание" };
  const hidden = (id) => find(id)?.value || "";
  const normalize = (id, value) => {
    if (["birth", "passissuedate"].includes(id)) return String(value).replace(/[-.]/g, "");
    if (["inn", "snils"].includes(id)) return String(value).replace(/\D/g, "");
    return String(value).trim().toLocaleUpperCase("ru");
  };
  const hasValue = (id, value) => normalize(id, value) !== "";
  const conflicts = [];
  for (const id of fieldIds) {
    if (hasValue(id, hidden(id)) && normalize(id, hidden(id)) !== normalize(id, person[id] || "")) conflicts.push(texts[id]);
  }
  for (const [key, id, text, checkbox] of [["noPatronymic", "ot", "Отчество", "ot.notvalue"], ["noSeries", "passseries", "Серия", "passseries.notvalue"]]) {
    if ((person[key] && hidden(id)) || (!person[key] && person[id] && find(checkbox)?.checked)) conflicts.push(text);
  }
  if (conflicts.length && !overwrite) return { conflicts: [...new Set(conflicts)] };

  const filled = [];
  const skipped = [];
  const failed = [];
  const emit = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  const enabled = (el) => {
    if (!el || el.disabled || el.readOnly || el.closest(".allzgsvalue[disabled]")) return false;
    for (let node = el.type === "hidden" ? el.parentElement : el; node && node !== root.parentElement; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return false;
    }
    return true;
  };
  const check = (id, value) => normalize(id, hidden(id)) === normalize(id, value);
  const waitForValue = async (id, value) => {
    for (let attempt = 0; attempt < 20; attempt++) {
      if (check(id, value)) return true;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return check(id, value);
  };

  async function choose(id, value) {
    const el = find(id);
    if (check(id, value)) return true;
    if (!enabled(el)) return false;
    const widget = el.parentElement.querySelector(".textex-container");
    if (!value) {
      const clear = widget?.querySelector(".currentclear");
      if (!clear) return false;
      clear.click();
      return waitForValue(id, "");
    }
    const option = [...(widget?.querySelectorAll(".option") || [])].find((item) => normalize(id, item.dataset.value) === normalize(id, value) || normalize(id, item.textContent) === normalize(id, value));
    if (!option) return false;
    widget.click();
    option.click();
    return waitForValue(id, option.dataset.value);
  }

  async function checkbox(id, checked) {
    const el = find(id);
    if (!el || el.checked === checked) return;
    if (enabled(el)) { el.click(); await tick(); }
  }

  for (const id of ["sex", "passcode"]) {
    const value = person[id];
    if (!value) continue;
    let ok = check(id, value);
    if (!ok && id === "sex") {
      const radio = find(`sex.${value}`);
      if (enabled(radio)) { radio.click(); await tick(); ok = check(id, value); }
    } else if (!ok) ok = await choose(id, value);
    if (!ok) return { error: `Не удалось выбрать «${texts[id]}». Проверьте открытую форму.`, filled, failed: [texts[id]] };
    filled.push(texts[id]);
  }

  await checkbox("ot.notvalue", Boolean(person.noPatronymic));
  await checkbox("passseries.notvalue", Boolean(person.noSeries));
  for (const [key, id, text] of [["noPatronymic", "ot.notvalue", "Нет отчества"], ["noSeries", "passseries.notvalue", "Нет серии"]]) {
    if (Boolean(person[key]) !== Boolean(find(id)?.checked)) failed.push(text);
  }

  for (const id of fieldIds.filter((key) => !["sex", "passcode"].includes(key))) {
    const value = person[id] || "";
    if ((!value && !overwrite) || (id === "ot" && person.noPatronymic) || (id === "passseries" && person.noSeries)) continue;
    const el = find(id);
    if (!enabled(el)) {
      if (check(id, value)) filled.push(texts[id]);
      else if (value) skipped.push(texts[id]);
      continue;
    }
    try {
      if (["citizenship", "country"].includes(id)) {
        if (!(await choose(id, value))) { failed.push(texts[id]); continue; }
      } else if (["birth", "passissuedate"].includes(id)) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        const spans = el.parentElement.querySelectorAll(".dateinput-input");
        if ((value && !match) || spans.length !== 3) { failed.push(texts[id]); continue; }
        const parts = value ? [match[3], match[2], match[1]] : ["ДД", "ММ", "ГГГГ"];
        for (let i = 0; i < spans.length; i++) {
          const span = spans[i];
          if (span.contentEditable !== "true") break;
          span.focus();
          span.textContent = parts[i];
          span.classList.toggle("placeholder", !value);
          emit(span, "input");
          span.blur();
        }
      } else {
        const prototype = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, "value").set.call(el, value);
        emit(el, "input");
        emit(el, "change");
        emit(el, "blur");
      }
      await tick();
      if (await waitForValue(id, value)) filled.push(texts[id]);
      else failed.push(texts[id]);
    } catch {
      failed.push(texts[id]);
    }
  }
  return { filled, skipped, failed };
}

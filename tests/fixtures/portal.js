import { JSDOM } from "jsdom";
import { fillPerson } from "../../extension/autofill.js";

export function portal({ url = "https://notary.kdmid.ru/", role = "поверенный", visible = true } = {}) {
  const dom = new JSDOM(`<!doctype html><body>
    <input id="pass" type="password" value="untouched">
    <input id="fnumber" value="untouched">
    <input id="prs" type="checkbox">
    <textarea id="document-text">untouched</textarea>
    <div id="allactors">
      <input id="role" readonly>
      <input id="actor" type="hidden" value="untouched">
      <div class="allzgsvalue"><input id="sex" type="hidden">
        <input id="sex.M" type="radio" name="sex.radio" value="M">
        <input id="sex.F" type="radio" name="sex.radio" value="F">
      </div>
      <div class="allzgsvalue"><input id="fam" disabled></div>
      <div class="allzgsvalue"><input id="im" disabled></div>
      <div class="allzgsvalue"><input id="ot" disabled><input id="ot.notvalue" type="checkbox"></div>
      <div class="allzgsvalue"><input id="birthplace"></div>
      <div class="allzgsvalue"><input id="namelat" disabled data-view="false"></div>
      <div class="allzgsvalue"><input id="passseries" disabled><input id="passseries.notvalue" type="checkbox"></div>
      <div class="allzgsvalue"><input id="passnumber" disabled></div>
      <div class="allzgsvalue"><textarea id="passissuer" disabled></textarea></div>
      <div class="allzgsvalue"><textarea id="address"></textarea></div>
      <div class="allzgsvalue"><input id="inn"></div>
      <div class="allzgsvalue"><input id="snils"></div>
      <div class="allzgsvalue"><textarea id="note"></textarea></div>
      <button id="add">Добавить</button>
    </div>
  </body>`, { url, runScripts: "outside-only", pretendToBeVisual: true });
  const { document, Event } = dom.window;
  const root = document.getElementById("allactors");
  root.getClientRects = () => visible ? [{ width: 400, height: 900 }] : [];
  document.getElementById("role").value = role;
  const field = (id) => [...root.querySelectorAll("input,textarea")].find((el) => el.id === id) || document.getElementById(id);
  const value = (id) => field(id).value;
  const set = (id, val) => { field(id).value = val; };

  for (const id of ["birth", "passissuedate"]) {
    const wrapper = document.createElement("div");
    wrapper.className = "allzgsvalue";
    wrapper.innerHTML = `<input type="hidden" id="${id}" data-type="date"><div class="dateinput-container"><span tabindex="0" contenteditable="true" class="dateinput-input placeholder">ДД</span><span tabindex="0" contenteditable="true" class="dateinput-input placeholder">ММ</span><span tabindex="0" contenteditable="true" class="dateinput-input placeholder">ГГГГ</span></div>`;
    root.append(wrapper);
    let timer;
    const spans = wrapper.querySelectorAll("span");
    for (const span of spans) {
      span.contentEditable = "true";
      span.addEventListener("blur", () => {
        dom.window.clearTimeout(timer);
        timer = dom.window.setTimeout(() => {
          const parts = [...spans].map((item) => item.textContent);
          const date = parts.every((part) => /^\d+$/.test(part)) ? parts[2] + parts[1] + parts[0] : "";
          set(id, date);
          field(id).dispatchEvent(new Event("change", { bubbles: true }));
        }, 100);
      });
    }
  }

  function dropdown(id, options, changed = () => {}) {
    const wrapper = document.createElement("div");
    wrapper.className = "allzgsvalue";
    wrapper.innerHTML = `<input type="hidden" data-type="textex" id="${id}"><div class="textex-container"><span class="currentclear">✖</span><span class="current"></span><div class="list"></div></div>`;
    const current = wrapper.querySelector(".current");
    for (const [key, label] of options) {
      const option = document.createElement("div");
      option.className = "option";
      option.dataset.value = key;
      option.textContent = label;
      option.addEventListener("click", () => { set(id, key); current.textContent = label; changed(key); });
      wrapper.querySelector(".list").append(option);
    }
    wrapper.querySelector(".currentclear").addEventListener("click", () => { set(id, ""); current.textContent = ""; changed(""); });
    root.append(wrapper);
  }
  dropdown("citizenship", [["РОССИЙСКАЯ ФЕДЕРАЦИЯ", "РОССИЙСКАЯ ФЕДЕРАЦИЯ"], ["АВСТРИЯ", "АВСТРИЯ"]]);
  dropdown("country", [["РОССИЙСКАЯ ФЕДЕРАЦИЯ", "РОССИЙСКАЯ ФЕДЕРАЦИЯ"], ["АВСТРИЯ", "АВСТРИЯ"]], () => set("address", ""));
  dropdown("passcode", [["dt_22", "Загранпаспорт гражданина Российской Федерации"], ["dt_10", "Паспорт иностранного гражданина"]], (code) => {
    const russian = code === "dt_22";
    for (const id of ["passseries", "passnumber", "passissuer"]) field(id).disabled = false;
    field("namelat").disabled = russian;
    field("namelat").parentElement.style.display = russian ? "none" : "";
    field("citizenship").disabled = russian;
    set("citizenship", russian ? "РОССИЙСКАЯ ФЕДЕРАЦИЯ" : "");
    field("passseries.notvalue").disabled = russian;
  });
  for (const sex of ["M", "F"]) {
    field(`sex.${sex}`).addEventListener("click", () => {
      set("sex", sex);
      for (const id of ["fam", "im", "ot"]) field(id).disabled = false;
    });
  }
  for (const id of ["ot", "passseries"]) {
    const checkbox = field(`${id}.notvalue`);
    checkbox.addEventListener("click", () => {
      field(id).disabled = checkbox.checked;
      if (checkbox.checked) set(id, "");
    });
  }
  document.getElementById("snils").addEventListener("input", (event) => {
    const digits = event.target.value.replace(/\D/g, "");
    if (digits.length === 11) event.target.value = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)} ${digits.slice(9)}`;
  });
  let added = 0;
  document.getElementById("add").addEventListener("click", () => { added++; });
  return { dom, document, root, value, set, added: () => added, fill: dom.window.eval(`(${fillPerson.toString()})`) };
}

export const sample = {
  sex: "F", fam: "Тестова", im: "Тест", ot: "Примеровна", birth: "1990-01-02", birthplace: "Москва",
  passcode: "dt_22", citizenship: "РОССИЙСКАЯ ФЕДЕРАЦИЯ", passseries: "00", passnumber: "0000000",
  passissuedate: "2020-03-04", passissuer: "Тестовый орган", country: "АВСТРИЯ", address: "Тестовый адрес",
  inn: "000000000000", snils: "00000000000", note: "Тестовые данные",
};

export function attachCountryPicker(input, countries) {
  const document = input.ownerDocument;
  const window = document.defaultView;
  const wrapper = document.createElement("div");
  wrapper.className = "country-picker";
  input.replaceWith(wrapper);
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "country-toggle";
  toggle.textContent = "▾";
  toggle.setAttribute("aria-label", "Открыть список стран адреса");
  toggle.setAttribute("aria-controls", "country-options");
  const list = document.createElement("div");
  list.id = "country-options";
  list.className = "country-options";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", "Страны адреса");
  list.hidden = true;
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", list.id);
  input.setAttribute("aria-expanded", "false");
  input.autocomplete = "off";
  wrapper.append(input, toggle, list);
  let matches = [];
  let active = -1;
  let allVisible = false;

  function highlight(index) {
    active = index;
    for (const [position, option] of [...list.children].entries()) {
      if (option.getAttribute("role") === "option") option.setAttribute("aria-selected", String(position === active));
    }
    const option = list.children[active];
    if (option?.getAttribute("role") === "option") {
      input.setAttribute("aria-activedescendant", option.id);
      option.scrollIntoView?.({ block: "nearest" });
    } else input.removeAttribute("aria-activedescendant");
  }

  function close() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    active = -1;
  }

  function choose(index) {
    if (!matches[index]) return;
    input.value = matches[index];
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    input.dispatchEvent(new window.Event("change", { bubbles: true }));
    input.focus();
    close();
  }

  function open(showAll = false) {
    const query = showAll ? "" : input.value.trim().toLocaleUpperCase("ru");
    allVisible = query === "";
    matches = countries.filter((country) => country.includes(query));
    list.replaceChildren();
    for (const [index, country] of matches.entries()) {
      const option = document.createElement("div");
      option.id = `country-option-${index}`;
      option.className = "country-option";
      option.setAttribute("role", "option");
      option.textContent = country;
      option.addEventListener("pointerdown", (event) => event.preventDefault());
      option.addEventListener("click", () => choose(index));
      list.append(option);
    }
    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "country-empty";
      empty.textContent = "Страна не найдена. Измените запрос.";
      empty.setAttribute("role", "status");
      list.append(empty);
    }
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-expanded", "true");
    highlight(matches.length ? 0 : -1);
  }

  input.addEventListener("focus", () => open());
  input.addEventListener("input", () => open());
  input.addEventListener("blur", () => close());
  input.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      if (list.hidden) open();
      else if (matches.length) highlight((active + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
    } else if (event.key === "Enter" && !list.hidden) {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Escape") {
      if (!list.hidden) { event.preventDefault(); event.stopPropagation(); }
      close();
    } else if (event.key === "Tab") close();
  });
  toggle.addEventListener("pointerdown", (event) => event.preventDefault());
  toggle.addEventListener("click", () => {
    if (!list.hidden && allVisible) close();
    else { input.focus(); open(true); }
  });
  document.addEventListener("click", (event) => { if (!wrapper.contains(event.target)) close(); });
}

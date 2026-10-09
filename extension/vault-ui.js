import { vaultRequest } from "./storage.js";

export async function attachVaultGate(content, ready, clear) {
  const gate = document.createElement("section");
  gate.className = "card vault-gate";
  const title = document.createElement("h2");
  const note = document.createElement("p");
  const disclosure = document.createElement("p");
  disclosure.className = "footnote";
  disclosure.textContent = "Расширение хранит ФИО, паспортные данные и адреса зашифрованными на этом компьютере. Разработчик их не получает. После нажатия «Заполнить» выбранные данные доступны официальному порталу notary.kdmid.ru.";
  const privacy = document.createElement("a");
  privacy.textContent = "Политика конфиденциальности";
  privacy.href = "https://github.com/ProjectNotFound404/kdmid/blob/main/PRIVACY.md";
  privacy.target = "_blank";
  privacy.rel = "noopener noreferrer";
  const form = document.createElement("form");
  const label = document.createElement("label");
  label.textContent = "Пароль хранилища";
  const password = document.createElement("input");
  password.type = "password";
  password.required = true;
  password.maxLength = 1024;
  label.append(password);
  const repeatLabel = document.createElement("label");
  repeatLabel.textContent = "Повторите пароль";
  const repeat = document.createElement("input");
  repeat.type = "password";
  repeat.autocomplete = "new-password";
  repeatLabel.append(repeat);
  const submit = document.createElement("button");
  submit.type = "submit";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  form.append(label, repeatLabel, submit);
  gate.append(title, note, disclosure, privacy, form, status);
  content.before(gate);
  const lockButton = document.createElement("button");
  lockButton.type = "button";
  lockButton.className = "secondary";
  lockButton.textContent = "Заблокировать хранилище";
  content.prepend(lockButton);
  let setup = false;
  let timer;
  let opening = false;
  let stateVersion = 0;
  async function refresh() {
    const version = ++stateVersion;
    try {
      const state = await vaultRequest("status");
      if (version !== stateVersion) return;
      setup = !!state.setup;
      if (state.unlocked) {
        opening = true;
        try { await ready(() => version === stateVersion); } finally { opening = false; }
        if (version !== stateVersion) return;
        gate.hidden = true;
        content.hidden = false;
        schedule();
      } else {
        clear();
        content.hidden = true;
        gate.hidden = false;
        title.textContent = setup ? "Защитите сохранённые данные" : "Хранилище заблокировано";
        note.textContent = setup ? `${state.legacy ? "Сохранённые люди будут перенесены без повторного ввода. " : ""}Задайте отдельный пароль от 12 символов. Он защищает данные и экспорт. При потере пароля восстановить доступ нельзя.` : "Введите пароль. Доступ действует до перезапуска Chrome или 15 минут бездействия.";
        repeatLabel.hidden = !setup;
        repeat.required = setup;
        password.minLength = setup ? 12 : 0;
        password.autocomplete = setup ? "new-password" : "current-password";
        submit.textContent = setup ? "Зашифровать и продолжить" : "Разблокировать";
      }
    } catch (error) {
      clear();
      content.hidden = true;
      gate.hidden = false;
      status.textContent = error.message;
      status.className = "error";
      submit.disabled = true;
    }
  }
  async function schedule() {
    clearTimeout(timer);
    const { vaultSession } = await chrome.storage.session.get("vaultSession");
    if (vaultSession) timer = setTimeout(() => vaultRequest("status").then(() => refresh()).catch(() => refresh()), Math.max(0, vaultSession.expires - Date.now()) + 50);
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "session" || !changes.vaultSession) return;
    if (!changes.vaultSession.newValue) {
      ++stateVersion;
      clearTimeout(timer);
      clear();
      content.hidden = true;
      gate.hidden = false;
      refresh();
    } else if (content.hidden && !submit.disabled) refresh();
    else if (!opening) schedule();
  });
  let lastTouch = 0;
  for (const type of ["pointerdown", "keydown"]) {
    document.addEventListener(type, (event) => {
      if (!event.isTrusted || content.hidden || Date.now() - lastTouch < 30000) return;
      lastTouch = Date.now();
      vaultRequest("touch").catch(() => refresh());
    });
  }
  lockButton.addEventListener("click", async () => {
    if (!confirm("Заблокировать хранилище? Несохранённые изменения будут очищены.")) return;
    await vaultRequest("lock");
    await refresh();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (setup && password.value !== repeat.value) { status.textContent = "Пароли не совпадают."; return; }
    submit.disabled = true;
    status.textContent = "Открываю хранилище…";
    const value = password.value;
    password.value = "";
    repeat.value = "";
    try {
      await vaultRequest(setup ? "setup" : "unlock", { password: value });
      status.textContent = "";
      await refresh();
    } catch (error) { status.textContent = error.message; status.className = "error"; }
    finally { submit.disabled = false; }
  });
  await refresh();
}

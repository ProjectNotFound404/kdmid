import { createVaultService } from "./vault-service.js";

const execute = createVaultService(chrome);
const allowed = new Set([chrome.runtime.getURL("people.html"), chrome.runtime.getURL("popup.html")]);
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || sender.tab?.url?.startsWith("https://") || !allowed.has(sender.url) || message?.type !== "vault") return;
  execute(message.action, message.values).then(
    (value) => respond({ ok: true, value }),
    (error) => respond({ ok: false, error: error.message || "Не удалось обработать хранилище." }),
  );
  return true;
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "vault-lock") execute("expire").catch(() => {});
});

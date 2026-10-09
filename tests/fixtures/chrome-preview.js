import { createVaultService } from "/vault-service.js";

const previewKey = "kdmid-ui-preview";
const listeners = [];
const areas = { local: JSON.parse(localStorage.getItem(previewKey) || "{}"), session: {} };
function storageArea(name) {
  const data = areas[name];
  return {
    async get(keys) { return Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map((key) => [key, structuredClone(data[key])])); },
    async set(values) {
      const changes = {};
      for (const [key, value] of Object.entries(values)) {
        changes[key] = { oldValue: data[key], newValue: value };
        data[key] = structuredClone(value);
      }
      if (name === "local") localStorage.setItem(previewKey, JSON.stringify(data));
      for (const listener of listeners) listener(changes, name);
    },
    async remove(key) {
      if (!(key in data)) return;
      const oldValue = data[key];
      delete data[key];
      for (const listener of listeners) listener({ [key]: { oldValue } }, name);
    },
    async setAccessLevel() {},
  };
}
let timer;
const api = {
  storage: { local: storageArea("local"), session: storageArea("session"), onChanged: { addListener(callback) { listeners.push(callback); } } },
  alarms: {
    async create(name, { when }) { clearTimeout(timer); timer = setTimeout(() => execute("expire"), when - Date.now()); },
    async clear() { clearTimeout(timer); },
  },
  tabs: { async query() { return [{ id: 1, url: location.href }]; } },
  runtime: {
    async openOptionsPage() { location.href = "/people.html"; },
    async sendMessage(message) {
      try { return { ok: true, value: await execute(message.action, message.values) }; }
      catch (error) { return { ok: false, error: error.message }; }
    },
  },
};
const execute = createVaultService(api);
globalThis.chrome = api;

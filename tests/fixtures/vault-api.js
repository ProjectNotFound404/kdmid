import { createVaultService } from "../../extension/vault-service.js";

export const testPassword = "test vault password 2026";
export function vaultApi(people = [], now = Date.now) {
  const local = { people: structuredClone(people) };
  const session = {};
  const listeners = [];
  const levels = [];
  const alarms = new Map();
  let writes = 0;
  let rejectWrites = false;
  const area = (data, name) => ({
    async get(keys) {
      return Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map((key) => [key, structuredClone(data[key])]));
    },
    async set(values) {
      if (name === "local") { if (rejectWrites) throw new Error("QUOTA_BYTES"); writes++; }
      const changes = {};
      for (const [key, value] of Object.entries(values)) {
        changes[key] = { oldValue: structuredClone(data[key]), newValue: structuredClone(value) };
        data[key] = structuredClone(value);
      }
      for (const listener of listeners) listener(changes, name);
    },
    async remove(key) {
      if (!(key in data)) return;
      const changes = { [key]: { oldValue: structuredClone(data[key]) } };
      delete data[key];
      for (const listener of listeners) listener(changes, name);
    },
    async setAccessLevel(level) { levels.push(level); },
  });
  const api = {
    storage: { local: area(local, "local"), session: area(session, "session"), onChanged: { addListener(listener) { listeners.push(listener); } } },
    alarms: { async create(name, config) { alarms.set(name, config); }, async clear(name) { return alarms.delete(name); } },
  };
  const execute = createVaultService(api, now);
  api.runtime = { async sendMessage(message) {
    try { return { ok: true, value: await execute(message.action, message.values) }; }
    catch (error) { return { ok: false, error: error.message }; }
  } };
  return { api, local, session, levels, alarms, execute, get writes() { return writes; }, failWrites(value = true) { rejectWrites = value; } };
}

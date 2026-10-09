import { normalizePerson } from "./profiles.js";
import { createBackup, readBackup, mergePeople, maxBackupBytes } from "./backup.js";
import { newVault, parseVault, deriveKey, decryptPeople, encryptPeople, sessionLifetime } from "./crypto-vault.js";

export function createVaultService(api, now = Date.now) {
  let queue = Promise.resolve();
  async function lock() {
    await api.storage.session.remove("vaultSession");
    await api.alarms.clear("vault-lock");
  }
  async function authorize(vault, touch = true) {
    const { vaultSession } = await api.storage.session.get("vaultSession");
    if (!vaultSession || vaultSession.expires <= now() || vaultSession.salt !== vault.salt) {
      await lock();
      throw new Error("Хранилище заблокировано. Введите пароль.");
    }
    if (touch) await remember(vaultSession.raw, vault.salt);
    return vaultSession.raw;
  }
  async function remember(raw, salt) {
    const expires = now() + sessionLifetime;
    await api.storage.session.set({ vaultSession: { raw, salt, expires } });
    await api.alarms.create("vault-lock", { when: expires });
  }
  async function handle(action, values = {}) {
    await api.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
    await api.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
    const stored = await api.storage.local.get(["vault", "people"]);
    if (action === "lock") { await lock(); return; }
    if (action === "expire") {
      const { vaultSession } = await api.storage.session.get("vaultSession");
      if (vaultSession && vaultSession.expires <= now()) await lock();
      return;
    }
    if (action === "status") {
      if (!stored.vault) return { setup: true, legacy: Array.isArray(stored.people) && stored.people.length > 0 };
      const vault = parseVault(stored.vault);
      try { await authorize(vault, false); return { unlocked: true }; }
      catch { return { unlocked: false }; }
    }
    if (action === "setup") {
      if (stored.vault) throw new Error("Хранилище уже настроено.");
      if (stored.people != null && !Array.isArray(stored.people)) throw new Error("Не удалось прочитать старые данные. Они сохранены без изменений.");
      const people = readBackup(createBackup(stored.people || []));
      const { vault, raw } = await newVault(people, values.password);
      await api.storage.local.set({ vault, people: null, selectedPersonId: null });
      await remember(raw, vault.salt);
      return;
    }
    if (!stored.vault) throw new Error("Сначала задайте пароль хранилища.");
    const vault = parseVault(stored.vault);
    if (action === "unlock") {
      const raw = await deriveKey(values.password, vault.salt);
      await decryptPeople(vault, raw);
      await remember(raw, vault.salt);
      return;
    }
    const raw = await authorize(vault);
    if (action === "touch") return;
    const people = await decryptPeople(vault, raw);
    if (action === "load") return people;
    if (action === "export") return JSON.stringify(vault, null, 2);
    let next;
    let result;
    if (action === "save") {
      const person = values.person;
      const saved = { id: person.id || crypto.randomUUID(), ...normalizePerson(person) };
      // Apply the same validation as backups before persisting identifiers.
      readBackup(createBackup([saved]));
      next = [...people];
      const index = next.findIndex((item) => item.id === saved.id);
      if (index === -1) next.push(saved);
      else next[index] = saved;
      result = saved;
    } else if (action === "delete") {
      next = people.filter((person) => person.id !== values.id);
    } else if (action === "import") {
      if (typeof values.text !== "string" || new TextEncoder().encode(values.text).length > maxBackupBytes * 2) throw new Error("Файл слишком большой или некорректный.");
      let parsed;
      try { parsed = JSON.parse(values.text.replace(/^\uFEFF/, "")); }
      catch { throw new Error("Не удалось прочитать файл экспорта."); }
      let incoming;
      if (parsed?.format === "kdmid-encrypted-vault") {
        const imported = parseVault(values.text);
        const importedKey = await deriveKey(values.password, imported.salt);
        incoming = await decryptPeople(imported, importedKey);
      } else {
        incoming = readBackup(values.text);
      }
      const merged = mergePeople(people, incoming);
      if (!merged.added) return { added: 0, skipped: merged.skipped };
      next = merged.people;
      result = { added: merged.added, skipped: merged.skipped };
    } else { throw new Error("Неизвестная операция хранилища."); }
    await api.storage.local.set({ vault: await encryptPeople(next, raw, vault.salt) });
    return result;
  }
  return (action, values) => {
    const operation = queue.then(() => handle(action, values));
    queue = operation.catch(() => {});
    return operation;
  };
}

export async function vaultRequest(action, values) {
  const response = await chrome.runtime.sendMessage({ type: "vault", action, values });
  if (!response?.ok) throw new Error(response?.error || "Не удалось открыть хранилище.");
  return response.value;
}

export const loadPeople = () => vaultRequest("load");
export const savePerson = (person) => vaultRequest("save", { person });
export const deletePerson = (id) => vaultRequest("delete", { id });
export const importPeople = (text, password) => vaultRequest("import", { text, password });
export const exportPeople = () => vaultRequest("export");

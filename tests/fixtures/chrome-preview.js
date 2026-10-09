const previewKey = "kdmid-ui-preview";
const data = () => JSON.parse(localStorage.getItem(previewKey) || "{}");
globalThis.chrome = {
  storage: { local: {
    async get(key) { return { [key]: data()[key] }; },
    async set(values) { localStorage.setItem(previewKey, JSON.stringify({ ...data(), ...values })); },
    async setAccessLevel() {},
  } },
  tabs: { async query() { return [{ id: 1, url: location.href }]; } },
  runtime: { async openOptionsPage() { location.href = "/people.html"; } },
};

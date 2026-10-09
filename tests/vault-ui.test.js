import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { vaultApi, testPassword } from "./fixtures/vault-api.js";

async function waitFor(check) {
  for (let i = 0; i < 200; i++) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  assert.fail("Timed out waiting for vault UI");
}

test("setup requires matching passwords, unlock masks input, and lock clears visible personal data", async () => {
  const fixture = vaultApi([{ id: "test", fam: "Тестов", im: "Тест" }]);
  const dom = new JSDOM('<main><div id="content" hidden><span id="name"></span></div></main>', { runScripts: "outside-only" });
  const { window } = dom;
  window.chrome = fixture.api;
  window.vaultRequest = async (action, values) => fixture.execute(action, values);
  window.confirm = () => true;
  const source = readFileSync("extension/vault-ui.js", "utf8").replace(/^import .*;\n/gm, "").replace("export async function", "async function");
  window.eval(`${source}\nwindow.attachVaultGate = attachVaultGate;`);
  const { document } = window;
  try {
    await window.attachVaultGate(document.getElementById("content"), async () => {
      document.getElementById("name").textContent = (await fixture.execute("load"))[0].fam;
    }, () => { document.getElementById("name").textContent = ""; });
    assert.match(document.querySelector(".vault-gate").textContent, /перенесены/);
    const [password, repeat] = document.querySelectorAll('.vault-gate input');
    assert.equal(password.type, "password");
    password.value = testPassword;
    repeat.value = "different";
    const submit = () => document.querySelector('.vault-gate form').dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    submit();
    assert.match(document.querySelector('.vault-gate [role="status"]').textContent, /не совпадают/);
    repeat.value = testPassword;
    submit();
    await waitFor(() => document.getElementById("name").textContent === "Тестов");
    assert.equal(document.getElementById("content").hidden, false);
    assert.equal(password.value, "");
    assert.equal(repeat.value, "");
    await fixture.execute("lock");
    await waitFor(() => document.getElementById("content").hidden);
    assert.equal(document.getElementById("name").textContent, "");
    password.value = "wrong";
    submit();
    await waitFor(() => /Неверный пароль/.test(document.querySelector('.vault-gate [role="status"]').textContent));
    assert.equal(document.getElementById("name").textContent, "");
    password.value = testPassword;
    submit();
    await waitFor(() => document.getElementById("name").textContent === "Тестов");
  } finally { dom.window.close(); }
});

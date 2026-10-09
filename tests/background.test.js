import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

test("vault messages are accepted only from this extension's popup and options page", async () => {
  let messageListener;
  let calls = 0;
  const base = "chrome-extension://test-id/";
  const api = {
    runtime: { id: "test-id", getURL: (path) => base + path, onMessage: { addListener(listener) { messageListener = listener; } } },
    alarms: { onAlarm: { addListener() {} } },
  };
  runInNewContext(readFileSync("extension/background.js", "utf8").replace(/^import .*;\n/gm, ""), {
    chrome: api,
    createVaultService: () => async () => { calls++; return { unlocked: false }; },
  });
  for (const sender of [
    { id: "other-extension", url: base + "people.html" },
    { id: "test-id", url: "https://notary.kdmid.ru/", tab: { url: "https://notary.kdmid.ru/" } },
    { id: "test-id", url: base + "unknown.html" },
    { id: "test-id", url: base + "popup.html", tab: { url: "https://notary.kdmid.ru/" } },
  ]) assert.equal(messageListener({ type: "vault", action: "load" }, sender, () => assert.fail("Untrusted sender got a response")), undefined);
  assert.equal(calls, 0);
  for (const path of ["popup.html", "people.html"]) {
    const response = await new Promise((resolve) => {
      assert.equal(messageListener({ type: "vault", action: "status" }, { id: "test-id", url: base + path }, resolve), true);
    });
    assert.equal(response.ok, true);
  }
  assert.equal(calls, 2);
});

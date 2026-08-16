const assert = require("node:assert/strict");
const path = require("node:path");
const { test } = require("node:test");
const { _electron: electron } = require("playwright");
const electronBinary = require("electron");

test("Electron opens the production Web build and preserves Web route behavior", async t => {
  const port = "4187";
  const electronApp = await electron.launch({
    executablePath: electronBinary,
    args: [path.resolve(__dirname, "..")],
    env: { ...process.env, PULSEFORGE_PORT: port, NODE_ENV: "production" },
  });
  t.after(async () => electronApp.close());

  const page = await electronApp.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForURL(`http://127.0.0.1:${port}/`);
  assert.match(await page.title(), /Gym Management|PulseForge/i);
  assert.match(await page.locator("body").innerText(), /PulseForge|Dashboard|Loading|تسجيل|Login/i);
  const languageButton = page.getByRole("button", { name: /العربية|English/ }).last();
  if (await languageButton.isVisible().catch(() => false)) {
    await languageButton.click();
    await page.waitForTimeout(100);
    assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
    assert.match(await page.locator("body").innerText(), /تسجيل الدخول|English/i);
  }

  await page.goto(`http://127.0.0.1:${port}/404`);
  await page.waitForLoadState("domcontentloaded");
  assert.equal(new URL(page.url()).pathname, "/404");
  assert.match(await page.locator("body").innerText(), /404|Page Not Found|الصفحة غير موجودة/i);
});

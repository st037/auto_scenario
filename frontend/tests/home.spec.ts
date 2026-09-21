import { test, expect } from "@playwright/test";

test("ホーム画面が表示される", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/.*/);
});
import { test, expect } from "@playwright/test";

test("ホーム画面が表示される", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("button", { name: /新しいシナリオを作成/ })
  ).toBeVisible();
});
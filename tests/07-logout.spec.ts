import { test, expect } from "../fixtures/storefront.fixture";

test("TC-25 | Logout ends the session and protected pages remain inaccessible after reload", { tag: ["@regression", "@functional", "@customer", "@auth"] }, async ({ customer: _customer, account, login, page }) => {
  await account.signOut();
  await login.expectAtLogin();
  await page.goto("/profile");
  await login.expectAtLogin();
  await page.reload();
  await login.expectAtLogin();
  await expect(account.navigation).toHaveCount(0);
  await page.goto("/checkout");
  await login.expectAtLogin();
  await expect(page.getByRole("button", { name: "Confirm COD order", exact: true })).toHaveCount(0);
});

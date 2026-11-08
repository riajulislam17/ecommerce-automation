import { test, expect } from "../fixtures/storefront.fixture";
import { requireCustomer } from "../config/environment";

test.describe("Customer Login", { tag: ["@regression", "@functional", "@auth"] }, () => {
  test("TC-01 | Empty login fields are required and cannot submit", { tag: ["@negative", "@ui"] }, async ({ login, page }) => {
    await login.open();
    let submitted = false;
    page.on("request", request => { if (request.url().endsWith("/api/auth/login") && request.method() === "POST") submitted = true; });
    await login.submit.click();
    expect(await login.email.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
    expect(await login.password.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
    await login.expectAtLogin();
    expect(submitted).toBe(false);
  });

  test("TC-02 | Invalid email format is rejected before login", { tag: ["@negative", "@ui"] }, async ({ login }) => {
    await login.open();
    await login.email.fill("invalid-email-format");
    await login.password.fill("NotARealPassword123!");
    await login.submit.click();
    expect(await login.email.evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true);
    await login.expectAtLogin();
  });

  test("TC-03 | Invalid credentials show an error without authenticating", { tag: "@negative" }, async ({ login, page }) => {
    await login.signIn("nonexistent-automation-customer@example.invalid", "InvalidAutomationPassword123!");
    await expect(login.error).toBeVisible();
    await expect(login.error).toHaveText(/invalid|incorrect|credentials|not found/i);
    await login.expectAtLogin();
    await page.goto("/profile");
    await login.expectAtLogin();
  });

  test("TC-04 | Valid customer login opens the profile and survives reload", { tag: "@customer" }, async ({ customer: _customer, login, page }) => {
    await login.expectSignedIn();
    await expect(login.main.getByText(requireCustomer().email, { exact: true }).first()).toBeVisible();
    await page.reload();
    await login.expectSignedIn();
    await expect(page).toHaveURL(/\/profile$/);
  });
});

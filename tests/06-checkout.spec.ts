import { randomUUID } from "node:crypto";
import { test, expect } from "../fixtures/storefront.fixture";
import { environment } from "../config/environment";
import { toCents } from "../utils/money";

test.describe("Checkout", { tag: ["@regression", "@functional", "@checkout"] }, () => {
  test("TC-21 | A guest cannot checkout and is sent to login with a return URL", { tag: "@negative" }, async ({ product, testProduct, cart, login, page }) => {
    await product.open(testProduct);
    await product.addToBag();
    await cart.open();
    await cart.checkout();
    await login.expectAtLogin();
    expect(new URL(page.url()).searchParams.get("next")).toBe("/checkout");
    await page.goto("/checkout");
    await login.expectAtLogin();
    await expect(page.getByRole("button", { name: "Confirm COD order", exact: true })).toHaveCount(0);
  });

  test("TC-22 | Address validation, selection and terms gate COD checkout", { tag: ["@customer", "@negative", "@ui"] }, async ({ customer: _customer, product, testProduct, checkout }) => {
    await product.open(testProduct);
    await product.addToBag();
    await checkout.open();
    await expect(checkout.confirm).toBeDisabled();
    await checkout.openAddressForm();
    await checkout.addressModal.getByRole("textbox", { name: "Full address", exact: true }).fill("");
    await checkout.addressModal.getByRole("button", { name: "Save Address", exact: true }).click();
    await expect(checkout.addressModal).toBeVisible();
    expect(await checkout.addressModal.getByRole("textbox", { name: "Full address", exact: true }).evaluate((input: HTMLTextAreaElement) => input.validity.valueMissing)).toBe(true);
    await checkout.addressModal.getByRole("button", { name: "Cancel", exact: true }).click();
    await checkout.ensureTestAddress();
    await checkout.waitForQuote();
    await expect(checkout.addressGroup.getByRole("checkbox", { checked: true })).toHaveCount(1);
    await expect(checkout.consent).not.toBeChecked();
    await expect(checkout.confirm).toBeDisabled();
    await checkout.acceptTerms();
    await checkout.addressGroup.getByRole("checkbox", { checked: true }).uncheck();
    await expect(checkout.confirm).toBeDisabled();
  });

  test("TC-23 | An invalid coupon shows an error and can be removed to recover the quote", { tag: ["@customer", "@negative", "@coupon"] }, async ({ customer: _customer, product, testProduct, checkout }) => {
    await product.open(testProduct);
    await product.addToBag();
    await checkout.open();
    await checkout.ensureTestAddress();
    await checkout.waitForQuote();
    const before = await checkout.total();
    await checkout.acceptTerms();
    const code = "QA-INVALID-" + randomUUID().slice(0, 8).toUpperCase();
    await checkout.applyCoupon(code);
    await expect(checkout.error).toBeVisible();
    await expect(checkout.error).toContainText(/coupon|invalid|expired|not found/i);
    await expect(checkout.confirm).toBeDisabled();
    await checkout.removeCoupon(code);
    expect(await checkout.total()).toBe(before);
    await expect(checkout.error).toHaveCount(0);
    await expect(checkout.confirm).toBeEnabled();
  });

  test("TC-24 | Full UI flow places one marked COD order with correct totals and details", { tag: ["@customer", "@order"] }, async ({ customer: _customer, product, testProduct, cart, checkout, order, page }, testInfo) => {
    test.skip(!environment.allowOrderCreation, "Set ALLOW_ORDER_CREATION=true to submit the real staging COD order.");
    test.setTimeout(150_000);
    const marker = `AUTOMATION TEST - DO NOT SHIP OR FULFIL | TC-24 | ${randomUUID()}`;
    await test.step("Select a real in-stock product and add it to the bag", async () => {
      await product.open(testProduct);
      await product.addToBag();
      await cart.open();
      await expect(cart.quantity()).toHaveValue("1");
      await cart.checkout();
      await expect(checkout.main.getByRole("heading", { name: "Checkout", exact: true })).toBeVisible();
      await expect(checkout.main.getByRole("button", { name: "Add Address", exact: true })).toBeEnabled();
    });
    await test.step("Select the test address, verify COD and reconcile the displayed quote", async () => {
      await checkout.ensureTestAddress();
      await checkout.waitForQuote();
      await expect(checkout.main.getByText("Cash on Delivery", { exact: true })).toBeVisible();
      const totals = await checkout.displayedTotals();
      const tax = Object.entries(totals).find(([label]) => label.startsWith("VAT / Tax"))?.[1] || 0;
      const expected = toCents(totals.Subtotal) + toCents(totals["Coupon Discount"]) + toCents(tax) + toCents(totals.Delivery);
      expect(toCents(totals.Total)).toBe(expected);
      expect(totals.Total).toBeGreaterThan(0);
      await checkout.main.getByRole("textbox", { name: "Delivery instructions", exact: true }).fill(marker);
      await checkout.acceptTerms();
    });
    const total = await checkout.total();
    let orderRequests = 0;
    page.on("request", request => {
      if (new URL(request.url()).pathname === "/api/orders" && request.method() === "POST") orderRequests++;
    });
    await test.step("Submit once and immediately record the real order response", async () => {
      const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === "/api/orders" && response.request().method() === "POST");
      await checkout.confirm.click();
      const response = await responsePromise;
      expect(response.ok(), "The real COD order request should succeed").toBe(true);
      const created = await response.json() as { id: string; number: string };
      // Persist the order ID before any later assertion can fail. Never automatically resubmit.
      await testInfo.attach("created-order", { body: JSON.stringify({ id: created.id, number: created.number, marker, total }, null, 2), contentType: "application/json" });
      testInfo.annotations.push({ type: "staging-order", description: created.number || created.id });
    });
    await test.step("Verify order details, unpaid COD, submitted total and empty cart", async () => {
      await order.expectPlaced(testProduct.name, marker, total);
      expect(orderRequests).toBe(1);
      await testInfo.attach("order-receipt", { body: JSON.stringify(await order.receipt(), null, 2), contentType: "application/json" });
      await cart.open();
      await cart.expectEmpty();
    });
  });
});

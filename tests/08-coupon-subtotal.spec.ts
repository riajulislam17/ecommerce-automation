import { test, expect } from "../fixtures/storefront.fixture";
import { requireCoupon } from "../config/environment";
import { toCents } from "../utils/money";

test("TC-26 | Valid coupon applies the expected discount, recalculates total and can be removed", {
  tag: ["@regression", "@functional", "@checkout", "@coupon", "@customer"],
}, async ({ customer: _customer, product, testProduct, checkout }) => {
  const coupon = requireCoupon();
  await product.open(testProduct);
  const unitPrice = await product.selectedPrice();
  await product.addToBag();
  await checkout.open();
  await checkout.ensureTestAddress();
  await checkout.waitForQuote();
  const before = await checkout.displayedTotals();
  expect(toCents(before.Subtotal)).toBe(toCents(unitPrice));
  expect(toCents(before["Coupon Discount"])).toBe(0);

  await checkout.applyCoupon(coupon.code);
  await checkout.waitForQuote();
  await expect.poll(async () => (await checkout.displayedTotals())["Coupon Discount"])
    .toBe(-coupon.expectedDiscount);
  await expect(checkout.error).toHaveCount(0);
  const after = await checkout.displayedTotals();
  const subtotal = toCents(after.Subtotal);
  const discount = toCents(coupon.expectedDiscount);
  expect(subtotal).toBe(toCents(before.Subtotal));
  expect(discount).toBeLessThanOrEqual(subtotal);

  const taxRow = Object.entries(after).find(([label]) => label.startsWith("VAT / Tax"));
  let tax = 0;
  if (taxRow) {
    const rate = taxRow[0].match(/^VAT \/ Tax \((\d+(?:\.\d+)?)%\)$/);
    expect(rate, "The tax row should expose its percentage").not.toBeNull();
    tax = Math.round((subtotal - discount) * Number(rate![1]) / 100);
    expect(toCents(taxRow[1])).toBe(tax);
  }
  // Delivery can change when a coupon moves the order below a free-shipping threshold.
  expect(toCents(after.Total)).toBe(subtotal - discount + tax + toCents(after.Delivery));
  await checkout.acceptTerms();

  await checkout.removeCoupon(coupon.code);
  await expect(checkout.couponInput).toHaveValue("");
  const restored = await checkout.displayedTotals();
  expect(toCents(restored["Coupon Discount"])).toBe(0);
  expect(toCents(restored.Subtotal)).toBe(toCents(before.Subtotal));
  expect(toCents(restored.Total)).toBe(toCents(before.Total));
  await expect(checkout.confirm).toBeEnabled();
});

test("TC-27 | Multi-product subtotal equals unit prices times quantities and updates after removal", {
  tag: ["@regression", "@functional", "@cart", "@subtotal"],
}, async ({ product, testProduct, secondTestProduct, cart, page }) => {
  await product.open(testProduct);
  const firstPrice = toCents(await product.selectedPrice());
  await product.addToBag(2);
  await product.open(secondTestProduct);
  const secondPrice = toCents(await product.selectedPrice());
  await product.addToBag(3);
  await cart.open();
  await expect(cart.rows).toHaveCount(2);
  const firstRow = cart.rowForProduct(testProduct.name);
  const secondRow = cart.rowForProduct(secondTestProduct.name);
  await expect(cart.quantity(firstRow)).toHaveValue("2");
  await expect(cart.quantity(secondRow)).toHaveValue("3");
  expect(toCents(await cart.lineTotal(firstRow))).toBe(firstPrice * 2);
  expect(toCents(await cart.lineTotal(secondRow))).toBe(secondPrice * 3);
  expect(toCents(await cart.subtotal())).toBe(firstPrice * 2 + secondPrice * 3);

  await cart.updateQuantity(firstRow, 1);
  await expect.poll(async () => toCents(await cart.subtotal())).toBe(firstPrice + secondPrice * 3);
  expect(toCents(await cart.lineTotal(firstRow))).toBe(firstPrice);
  await cart.removeItem(firstRow);
  await expect(cart.rows).toHaveCount(1);
  expect(toCents(await cart.subtotal())).toBe(secondPrice * 3);
  await page.reload();
  await expect(cart.quantity(secondRow)).toHaveValue("3");
  expect(toCents(await cart.subtotal())).toBe(secondPrice * 3);
});

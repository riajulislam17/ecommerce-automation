import { test, expect } from "../fixtures/storefront.fixture";
import { toCents } from "../utils/money";

test.describe("Shopping Bag", { tag: ["@regression", "@functional", "@cart"] }, () => {
  test.beforeEach(async ({ product, testProduct }) => {
    await product.open(testProduct);
    await product.addToBag();
  });

  test("TC-15 | Add to cart shows the correct product, image, price and quantity", { tag: "@ui" }, async ({ product, cart, testProduct }) => {
    const price = await product.selectedPrice();
    await cart.open();
    await expect(cart.rows).toHaveCount(1);
    await expect(cart.rows.first()).toContainText(testProduct.name);
    await cart.expectImageLoaded(cart.rows.first().locator("img"));
    await expect(cart.quantity()).toHaveValue("1");
    expect(await cart.lineTotal()).toBe(price);
    expect(await cart.subtotal()).toBe(price);
  });

  test("TC-16 | Adding the same SKU again merges into one cart line", async ({ product, cart }) => {
    await product.addToBag();
    await cart.open();
    await expect(cart.rows).toHaveCount(1);
    await expect(cart.quantity()).toHaveValue("2");
  });

  test("TC-17 | Increasing quantity by +2 updates quantity, line total and subtotal", async ({ cart }) => {
    await cart.open();
    const unitPrice = await cart.lineTotal();
    await cart.increaseTwice();
    expect(toCents(await cart.lineTotal())).toBe(toCents(unitPrice) * 3);
    expect(toCents(await cart.subtotal())).toBe(toCents(unitPrice) * 3);
  });

  test("TC-18 | Setting quantity to 0 removes the item and shows an empty bag", { tag: "@negative" }, async ({ cart, page }) => {
    await cart.open();
    await cart.quantity().fill("0");
    await cart.expectEmpty();
    await page.reload();
    await cart.expectEmpty();
  });

  test("TC-19 | Quantity -1 is rejected and cannot produce a negative cart total", { tag: "@negative" }, async ({ cart, page }) => {
    await cart.open();
    const before = await cart.subtotal();
    await cart.quantity().fill("-1");
    await cart.quantity().blur();
    await expect(cart.quantity()).toHaveValue("1");
    expect(await cart.subtotal()).toBe(before);
    await page.reload();
    await expect(cart.quantity()).toHaveValue("1");
    expect(await cart.subtotal()).toBeGreaterThan(0);
  });

  test("TC-20 | Cart retains its selected quantity after refresh and navigation", async ({ cart, page }) => {
    await cart.open();
    await cart.increaseTwice();
    const subtotal = await cart.subtotal();
    await page.reload();
    await expect(cart.quantity()).toHaveValue("3");
    expect(await cart.subtotal()).toBe(subtotal);
    await cart.main.getByRole("link", { name: "Continue shopping", exact: true }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await cart.open();
    await expect(cart.quantity()).toHaveValue("3");
    expect(await cart.subtotal()).toBe(subtotal);
  });
});

import { test, expect } from "../fixtures/storefront.fixture";

test.describe("Product Listing", { tag: ["@regression", "@functional"] }, () => {
  test("TC-08 | Listing displays product name, loaded image, price and details link", { tag: "@ui" }, async ({ shop }) => {
    await shop.open();
    const card = shop.cards.first();
    const product = await shop.productLink(card);
    await shop.expectImageLoaded(card.locator("img"));
    await expect(shop.productTitle(card, product.name)).toBeVisible();
    await expect(card.locator("strong")).toHaveText(/\d/);
    await card.getByRole("link", { name: "View", exact: true }).click();
    await expect(shop.main.getByRole("heading", { level: 1, name: product.name, exact: true })).toBeVisible();
  });

  test("TC-09 | Category filter shows only products from the selected category", async ({ shop, page }) => {
    await shop.open();
    await shop.category.click();
    const category = page.getByRole("option").filter({ hasNotText: /^All categories$/ }).first();
    const name = (await category.innerText()).trim();
    await category.click();
    await expect(shop.category).toContainText(name);
    await expect(shop.cards.first()).toBeVisible();
    for (const card of await shop.cards.all())
      expect((await card.locator("p").first().innerText()).trim().toLowerCase()).toBe(name.toLowerCase());
  });

  test("TC-10 | Price sort orders the entire listing ascending and descending", async ({ shop }) => {
    await shop.open();
    const initialPrices = await shop.prices();
    expect(initialPrices.length).toBeGreaterThan(1);
    for (const [label, direction] of [["Price: low to high", 1], ["Price: high to low", -1]] as const) {
      await shop.chooseOption(shop.sort, label);
      await expect.poll(() => shop.prices()).toEqual([...initialPrices].sort((a, b) => direction * (a - b)));
    }
  });

  test("TC-11 | Unmatched product search shows an empty state and can be cleared", { tag: ["@negative", "@ui"] }, async ({ shop }) => {
    await shop.open();
    await shop.search.fill("qa-no-product-7c4350a1-never-match");
    await expect(shop.cards).toHaveCount(0);
    await expect(shop.main.getByText("No products match your search.", { exact: true })).toBeVisible();
    await shop.main.getByRole("button", { name: "Clear Search", exact: true }).click();
    await expect(shop.search).toHaveValue("");
    await expect(shop.cards.first()).toBeVisible();
  });
});

import { test, expect } from "../fixtures/storefront.fixture";

test.describe("Homepage And Navigation", { tag: ["@regression", "@ui"] }, () => {
  test("TC-05 | Homepage renders banners, benefits, products, story and footer", async ({ home, page }) => {
    await home.open();
    const banner = home.main.getByRole("region", { name: "Promotional Banners", exact: true });
    await expect(banner).toBeVisible();
    await home.expectImageLoaded(banner.locator("img"));
    await expect(home.main.getByRole("region", { name: "Trust And Benefits", exact: true })).toBeVisible();
    await expect(home.main.getByRole("link", { name: "Explore Our Factory", exact: true })).toHaveAttribute("href", "/inside-our-factory");
    await expect(home.main.getByRole("link", { name: /craftsmanship/i })).toHaveAttribute("href", "/craftsmanship");
    await expect(home.main.getByRole("link", { name: /appointment|factory visit|book.*visit/i }).first()).toHaveAttribute("href", "/factory-visit");
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await home.expectNoHorizontalOverflow();
  });

  test("TC-06 | Mobile navigation shows Home, Search, Campaigns, Account and Bag", { tag: "@functional" }, async ({ page, home }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await home.open();
    const navigation = home.mobileNavigation;
    await expect(navigation).toBeVisible();
    await expect(navigation.locator("a,button")).toHaveCount(5);
    await expect(navigation.getByRole("link", { name: "Home", exact: true }).locator("svg.lucide-house")).toBeVisible();
    await expect(navigation.getByRole("button", { name: "Search", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Account", exact: true })).toHaveAttribute("href", "/profile");
    await expect(navigation.getByRole("button", { name: "Open shopping bag", exact: true })).toBeVisible();
    await navigation.getByRole("link", { name: "Campaigns", exact: true }).click();
    await expect(page).toHaveURL(/\/campaigns$/);
    await expect(home.main.getByRole("heading", { name: "The Campaign Edit", exact: true })).toBeVisible();
    await expect(home.main.getByRole("heading", { level: 2 }).first()).toBeVisible();
    await home.expectNoHorizontalOverflow();
  });

  test("TC-07 | Header search opens in place then submits to filtered products", { tag: "@functional" }, async ({ page, home, shop }) => {
    await home.open();
    const name = await home.main.locator("article img").first().getAttribute("alt");
    expect(name).toBeTruthy();
    await home.openSearch();
    expect(new URL(page.url()).pathname).toBe("/");
    await home.submitSearch(name!);
    await expect(home.searchDialog).not.toBeVisible();
    await expect(shop.cards).toHaveCount(1);
    await expect(shop.productTitle(shop.cards.first(), name!)).toBeVisible();
  });
});

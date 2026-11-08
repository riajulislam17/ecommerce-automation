import { expect, type Locator, type Page } from "@playwright/test";
import { environment } from "../config/environment";
import { BasePage } from "./base.page";
import { ShopPage, type ProductLink } from "./shop.page";
import { moneyValue } from "../utils/money";

export class ProductPage extends BasePage {
  quantity = this.main.getByRole("spinbutton", { name: "Quantity", exact: true });
  addButton = this.main.getByRole("button", { name: /^(Add to bag|Added to bag)$/ });
  panel = this.main.locator(".shop-panel").first();
  preview = this.page.getByRole("dialog", { name: "Image Preview", exact: true });
  imageButton = this.main.getByRole("button", { name: /^Zoom Image:/ });
  variantGroups = this.panel.getByRole("group");

  open = async (product: ProductLink) => {
    await this.goto(product.path);
    await expect(this.main.getByRole("heading", { level: 1, name: product.name, exact: true })).toBeVisible();
    await expect(this.quantity).toBeVisible();
    await expect(this.addButton).toBeEnabled();
  };

  addToBag = async (quantity = 1) => {
    await this.quantity.fill(String(quantity));
    await this.addButton.click();
    await expect(this.addButton).toHaveText("Added to bag");
  };

  selectedPrice = async () => moneyValue(await this.panel.locator("p.font-bold").first().innerText());

  chooseOption = async (radio: Locator) => {
    // The native radio is visually hidden inside its visible option label.
    await radio.locator("..").click();
    await expect(radio).toBeChecked();
  };
}

export const discoverProduct = async (page: Page, withOptions = false, excludePath?: string): Promise<ProductLink> => {
  const shop = new ShopPage(page);
  await shop.open();
  const links: ProductLink[] = [];
  for (const card of (await shop.cards.all()).slice(0, 20)) links.push(await shop.productLink(card));
  const pinnedSlug = !withOptions && !excludePath ? environment.productSlug : "";
  if (pinnedSlug) {
    const chosen = links.find(({ path }) => path === `/products/${pinnedSlug}`);
    if (!chosen) {
      await shop.goto(`/products/${pinnedSlug}`);
      const name = await shop.main.getByRole("heading", { level: 1 }).innerText();
      links.unshift({ name, path: `/products/${pinnedSlug}` });
    } else links.unshift(chosen);
  }
  for (const link of links) {
    if (link.path === excludePath || (pinnedSlug && link.path !== `/products/${pinnedSlug}`)) continue;
    const product = new ProductPage(page);
    await product.goto(link.path);
    await expect(product.quantity).toBeVisible();
    await expect(product.panel.getByRole("status")).toBeVisible();
    if (!(await product.addButton.isEnabled()) || Number(await product.quantity.getAttribute("max")) < 3) continue;
    if (withOptions) {
      let enoughOptions = false;
      for (const group of await product.variantGroups.all()) {
        if (await group.getByRole("radio").and(page.locator(":not(:disabled)")).count() >= 2) enoughOptions = true;
      }
      if (!enoughOptions) continue;
    }
    return link;
  }
  throw new Error(`Staging needs ${excludePath ? "a second distinct" : "a"} published product with at least 3 units in its initially selected SKU${withOptions ? " and two available attribute options" : ""}. Set TEST_PRODUCT_SLUG or update the test catalog.`);
};

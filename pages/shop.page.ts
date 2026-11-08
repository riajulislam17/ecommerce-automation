import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { moneyValue } from "../utils/money";

export type ProductLink = { path: string; name: string };

export class ShopPage extends BasePage {
  cards = this.main.locator("article");
  search = this.main.getByRole("searchbox", { name: "Search products", exact: true });
  category = this.main.getByRole("combobox", { name: "Category", exact: true });
  sort = this.main.getByRole("combobox", { name: "Sort", exact: true });

  open = async () => {
    await this.goto("/shop");
    await expect(this.main.getByRole("heading", { name: "Our collection", exact: true })).toBeVisible();
    await expect(this.cards.first()).toBeVisible();
  };

  productLink = async (card: Locator): Promise<ProductLink> => {
    const link = card.getByRole("link", { name: "View", exact: true });
    const path = await link.getAttribute("href");
    const name = await card.locator("img").getAttribute("alt");
    if (!path || !name) throw new Error("A product card is missing its product link or image title.");
    return { path, name };
  };

  productTitle = (card: Locator, name: string) => card.getByText(name, { exact: true });

  chooseOption = async (trigger: Locator, name: string) => {
    await trigger.click();
    await this.page.getByRole("option", { name, exact: true }).click();
    await expect(trigger).toContainText(name);
    await expect(this.page.getByRole("option")).toHaveCount(0);
  };

  prices = async () => (await this.cards.locator("strong").allTextContents()).map(moneyValue);
}

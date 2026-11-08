import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { moneyValue } from "../utils/money";

export class CartPage extends BasePage {
  rows = this.main.locator("article");
  summary = this.main.getByRole("complementary");

  open = async () => {
    await this.goto("/cart");
    await expect(this.main.getByRole("heading", { name: "Your shopping bag", exact: true })).toBeVisible();
    await expect(this.main.getByRole("status")).toHaveCount(0);
  };

  quantity = (row: Locator = this.rows.first()) => row.getByRole("spinbutton");
  rowForProduct = (name: string) => this.rows.filter({ has: this.page.getByRole("link", { name, exact: true }) });
  updateQuantity = async (row: Locator, quantity: number) => {
    await this.quantity(row).fill(String(quantity));
    await expect(this.quantity(row)).toHaveValue(String(quantity));
  };
  removeItem = async (row: Locator) => {
    await row.getByRole("button", { name: /^Remove / }).click();
    await expect(row).toHaveCount(0);
  };
  lineTotal = async (row: Locator = this.rows.first()) => moneyValue(await row.locator("strong").innerText());
  subtotal = async () => moneyValue(await this.summary.locator("strong").first().innerText());

  increaseTwice = async () => {
    const increment = this.rows.first().getByRole("button", { name: /^Increase Quantity/ });
    await increment.click();
    await increment.click();
    await expect(this.quantity()).toHaveValue("3");
  };

  checkout = async () => {
    await this.summary.getByRole("link", { name: /^(Proceed to checkout|Sign in to checkout)$/ }).click();
  };

  expectEmpty = async () => {
    await expect(this.main.getByText("Your bag is empty.", { exact: true })).toBeVisible();
    await expect(this.rows).toHaveCount(0);
    await expect(this.summary).toHaveCount(0);
  };
}

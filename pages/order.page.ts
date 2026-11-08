import { expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { moneyValue } from "../utils/money";

export class OrderPage extends BasePage {
  summary = this.main.getByRole("complementary");

  expectPlaced = async (productName: string, marker: string, total: number) => {
    await expect(this.page).toHaveURL(/\/orders\/[^/?]+\?placed=1$/);
    await expect(this.main.getByText("Order received", { exact: true })).toBeVisible();
    await expect(this.main.getByRole("heading", { level: 1 })).toHaveText(/\S+/);
    await expect(this.main.getByText(productName, { exact: true })).toBeVisible();
    await expect(this.main.getByText(`Instructions: ${marker}`, { exact: true })).toBeVisible();
    await expect(this.summary.getByText(/Cash on Delivery/)).toContainText(/unpaid|pending/i);
    const displayedTotal = this.summary.locator("dl > div").filter({ has: this.page.locator("dt", { hasText: /^Total$/ }) }).locator("dd");
    expect(moneyValue(await displayedTotal.innerText())).toBe(total);
  };

  receipt = async () => ({
    number: await this.main.getByRole("heading", { level: 1 }).innerText(),
    url: this.page.url(),
  });
}

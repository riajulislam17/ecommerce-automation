import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class HomePage extends BasePage {
  mobileNavigation = this.page.getByRole("navigation", { name: "Mobile Navigation" });
  searchDialog = this.page.getByRole("dialog", { name: "Search Products", exact: true });

  open = async () => {
    await this.goto("/");
    await expect(this.main.getByRole("heading", { level: 1 })).toBeAttached();
    await expect(this.main.locator("article").first()).toBeVisible();
  };

  openSearch = async () => {
    const search = this.page.getByRole("button", { name: "Search", exact: true });
    for (const button of await search.all()) {
      if (await button.isVisible()) {
        await button.click();
        break;
      }
    }
    await expect(this.searchDialog).toBeVisible();
  };

  submitSearch = async (query: string) => {
    await this.searchDialog.getByRole("searchbox", { name: "Search Products", exact: true }).fill(query);
    await this.searchDialog.getByRole("button", { name: "Search", exact: true }).click();
    await expect(this.page).toHaveURL(/\/shop\?search=/);
  };
}

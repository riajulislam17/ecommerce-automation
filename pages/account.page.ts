import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class AccountPage extends BasePage {
  navigation = this.page.getByRole("navigation", { name: "Account Navigation" });

  signOut = async () => {
    await this.goto("/profile");
    await this.navigation.getByRole("button", { name: "Sign Out", exact: true }).click();
    await expect(this.page).toHaveURL(/\/login(?:\?|$)/);
    await expect(this.navigation).toHaveCount(0);
  };
}

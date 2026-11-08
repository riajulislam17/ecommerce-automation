import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  email = this.main.getByRole("textbox", { name: "Email", exact: true });
  password = this.main.locator('input[name="password"]');
  submit = this.main.getByRole("button", { name: "Sign in", exact: true });
  error = this.main.getByRole("alert");

  open = async (next = "/profile") => {
    await this.goto(`/login?next=${encodeURIComponent(next)}`);
    await expect(this.submit).toBeVisible();
  };

  signIn = async (email: string, password: string, next = "/profile") => {
    await this.open(next);
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  };

  expectSignedIn = async () => {
    await expect(this.page.getByRole("navigation", { name: "Account Navigation" })).toBeVisible();
    await expect(this.main.getByRole("heading", { name: "My Profile", exact: true })).toBeVisible();
  };

  expectAtLogin = async () => {
    await expect(this.page).toHaveURL(/\/login(?:\?|$)/);
    await expect(this.submit).toBeVisible();
  };
}

import { expect } from "@playwright/test";
import { environment } from "../config/environment";
import { BasePage } from "./base.page";
import { moneyValue } from "../utils/money";

export class CheckoutPage extends BasePage {
  confirm = this.main.getByRole("button", { name: "Confirm COD order", exact: true });
  addressGroup = this.main.getByRole("group", { name: "Delivery addresses", exact: true });
  addressModal = this.page.getByRole("dialog", { name: "Add Address", exact: true });
  consent = this.main.getByRole("checkbox", { name: /I agree to the/ });
  summary = this.main.getByRole("complementary");
  error = this.main.getByRole("alert");
  couponInput = this.main.getByRole("textbox", { name: "Coupon code", exact: true });

  applyCoupon = async (code: string) => {
    await this.couponInput.fill(code);
    const quote = this.page.waitForResponse((response) =>
      new URL(response.url()).pathname === "/api/orders/quote" &&
      response.request().method() === "POST" &&
      response.request().postDataJSON().coupon_code === code,
    );
    await this.summary.getByRole("button", { name: "Apply", exact: true }).click();
    await (await quote).finished();
  };

  removeCoupon = async (code: string) => {
    const quote = this.page.waitForResponse((response) =>
      new URL(response.url()).pathname === "/api/orders/quote" &&
      response.request().method() === "POST" &&
      !response.request().postDataJSON().coupon_code,
    );
    await this.summary.getByRole("button", { name: `Remove ${code}`, exact: true }).click();
    await (await quote).finished();
    await this.waitForQuote();
  };

  open = async () => {
    await this.goto("/checkout");
    await expect(this.main.getByRole("heading", { name: "Checkout", exact: true })).toBeVisible();
    await expect(this.main.getByRole("button", { name: "Add Address", exact: true })).toBeEnabled();
  };

  openAddressForm = async () => {
    await this.main.getByRole("button", { name: "Add Address", exact: true }).click();
    await expect(this.addressModal).toBeVisible();
  };

  ensureTestAddress = async () => {
    // Reuse only this dedicated test address. Never select a customer's real address.
    const saved = this.addressGroup.getByRole("checkbox", { name: new RegExp(environment.address.line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
    if (await saved.count()) {
      await saved.first().check();
      return;
    }
    await this.openAddressForm();
    await this.addressModal.getByRole("textbox", { name: "Address label", exact: true }).fill(environment.address.label);
    await this.addressModal.getByRole("textbox", { name: "Recipient name", exact: true }).fill(environment.address.name);
    await this.addressModal.getByRole("textbox", { name: "Mobile number", exact: true }).fill(environment.address.phone);
    await this.addressModal.getByRole("textbox", { name: "Area", exact: true }).fill(environment.address.area);
    await this.addressModal.getByRole("textbox", { name: "Full address", exact: true }).fill(environment.address.line);
    await this.addressModal.getByRole("button", { name: "Save Address", exact: true }).click();
    await expect(this.addressModal).not.toBeVisible();
    await expect(saved.first()).toBeChecked();
  };

  waitForQuote = async () => {
    await expect(this.summary.locator("dt").filter({ hasText: /^Total$/ })).toBeVisible();
    await expect(this.summary.getByText("Calculating total…", { exact: true })).toHaveCount(0);
  };

  displayedTotals = async () => {
    const totals: Record<string, number> = {};
    for (const row of await this.summary.locator("dl > div").all()) {
      const label = (await row.locator("dt").innerText()).trim();
      totals[label] = moneyValue(await row.locator("dd").innerText());
    }
    return totals;
  };

  total = async () => (await this.displayedTotals()).Total;

  acceptTerms = async () => {
    await this.consent.check();
    await expect(this.confirm).toBeEnabled();
  };
}

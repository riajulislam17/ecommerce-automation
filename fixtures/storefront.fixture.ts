import { test as base, expect } from "@playwright/test";
import { requireCustomer } from "../config/environment";
import { AccountPage } from "../pages/account.page";
import { CartPage } from "../pages/cart.page";
import { CheckoutPage } from "../pages/checkout.page";
import { HomePage } from "../pages/home.page";
import { LoginPage } from "../pages/login.page";
import { OrderPage } from "../pages/order.page";
import { ProductPage, discoverProduct } from "../pages/product.page";
import { ShopPage, type ProductLink } from "../pages/shop.page";

type Pages = {
  home: HomePage;
  login: LoginPage;
  shop: ShopPage;
  product: ProductPage;
  cart: CartPage;
  checkout: CheckoutPage;
  order: OrderPage;
  account: AccountPage;
  customer: void;
  runtimeErrors: void;
};
type WorkerData = { testProduct: ProductLink; variantProduct: ProductLink; secondTestProduct: ProductLink };

export const test = base.extend<Pages, WorkerData>({
  home: async ({ page }, use) => { await use(new HomePage(page)); },
  login: async ({ page }, use) => { await use(new LoginPage(page)); },
  shop: async ({ page }, use) => { await use(new ShopPage(page)); },
  product: async ({ page }, use) => { await use(new ProductPage(page)); },
  cart: async ({ page }, use) => { await use(new CartPage(page)); },
  checkout: async ({ page }, use) => { await use(new CheckoutPage(page)); },
  order: async ({ page }, use) => { await use(new OrderPage(page)); },
  account: async ({ page }, use) => { await use(new AccountPage(page)); },
  customer: async ({ login }, use) => {
    const credentials = requireCustomer();
    await login.signIn(credentials.email, credentials.password);
    await login.expectSignedIn();
    await use();
  },
  testProduct: [async ({ browser }, use, workerInfo) => {
    const page = await browser.newPage({ baseURL: workerInfo.project.use.baseURL });
    try { await use(await discoverProduct(page)); }
    finally { await page.close(); }
  }, { scope: "worker" }],
  variantProduct: [async ({ browser }, use, workerInfo) => {
    const page = await browser.newPage({ baseURL: workerInfo.project.use.baseURL });
    try { await use(await discoverProduct(page, true)); }
    finally { await page.close(); }
  }, { scope: "worker" }],
  secondTestProduct: [async ({ browser, testProduct }, use, workerInfo) => {
    const page = await browser.newPage({ baseURL: workerInfo.project.use.baseURL });
    try { await use(await discoverProduct(page, false, testProduct.path)); }
    finally { await page.close(); }
  }, { scope: "worker" }],
  runtimeErrors: [async ({ page }, use, testInfo) => {
    const errors: string[] = [];
    const capture = (error: Error) => errors.push(error.message);
    page.on("pageerror", capture);
    await use();
    page.off("pageerror", capture);
    if (errors.length) {
      await testInfo.attach("browser-runtime-errors", { body: JSON.stringify(errors, null, 2), contentType: "application/json" });
      expect(errors, "The storefront should not throw unhandled browser errors").toEqual([]);
    }
  }, { auto: true }],
});

export { expect } from "@playwright/test";

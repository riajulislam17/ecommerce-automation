import { expect, type Locator, type Page } from "@playwright/test";

export class BasePage {
  readonly main: Locator;
  constructor(readonly page: Page) {
    this.main = page.getByRole("main");
  }

  goto = async (url: string) => {
    // Product pages render on the server. Wait for the real client catalog request
    // so interactions do not race ahead of React attaching event handlers.
    const clientReady = this.page.waitForResponse((response) =>
      ["/api/catalog", "/api/storefront/homepage"].includes(new URL(response.url()).pathname) &&
      response.request().method() === "GET",
    );
    const response = await this.page.goto(url, { waitUntil: "domcontentloaded" });
    expect(response?.ok(), `Page should load successfully: ${url}`).toBeTruthy();
    const catalog = await clientReady;
    expect(catalog.ok(), "The storefront client catalog should load successfully").toBe(true);
    await catalog.finished();
  };

  expectImageLoaded = async (image: Locator) => {
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) =>
      element.complete && element.naturalWidth > 0,
    ), { message: "The product image should load, not just render an empty frame" }).toBe(true);
  };

  expectNoHorizontalOverflow = async () => {
    expect(await this.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  };
}

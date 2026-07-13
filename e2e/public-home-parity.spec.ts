import { expect, test } from "@playwright/test";

test.describe("localized public home parity", () => {
  test.describe.configure({ mode: "serial" });

  test("keeps the localized header grammar and the figma-style hero composition live", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.goto("/es");

    await expect(page.getByRole("navigation")).toContainText("Inicio");
    await expect(page.getByRole("navigation")).toContainText("Habitaciones");
    await expect(page.getByRole("navigation")).toContainText("Servicios");

    const hero = page.locator('section[aria-label="Hero principal de Wakaya"]');
    await hero.getByRole("button", { name: "Go to slide 1" }).click();
    await expect(hero.getByText("Pucallpa · Amazonía peruana")).toBeVisible();
    await expect(hero.getByRole("heading", { name: "Wakaya Ecolodge" })).toBeVisible();
    await expect(hero.getByText("Un encuentro con lo Magico")).toBeVisible();
    await expect(hero.getByRole("link", { name: "Reservar ahora" })).toHaveAttribute(
      "href",
      "/es/contact",
    );
    await expect(hero.getByRole("link", { name: "Explorar experiencias" })).toHaveAttribute(
      "href",
      "/es/services",
    );

    const heroBox = await hero.boundingBox();
    const viewport = page.viewportSize();

    expect(heroBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(Math.abs(heroBox!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(heroBox!.width - viewport!.width)).toBeLessThanOrEqual(1);
    expect(heroBox!.height).toBeGreaterThanOrEqual(viewport!.height - 24);
  });

  test("routes the quick home form into public search results instead of jumping straight to contact", async ({
    page,
  }) => {
    await page.goto("/es");

    await page.getByLabel("Check in").fill("2026-07-20");
    await page.getByLabel("Check out").fill("2026-07-22");
    await page.getByLabel("Personas").selectOption("4");

    const category = page.locator('select[name="category"] option[value]').nth(1);
    const categoryValue = await category.getAttribute("value");

    expect(categoryValue).toBeTruthy();
    await page.getByLabel("Habitacion").selectOption(categoryValue!);
    await page.getByRole("button", { name: "Ver opciones" }).click();

    await expect(page).toHaveURL(
      new RegExp(
        `/es/bungalows\\?checkIn=2026-07-20&checkOut=2026-07-22&guests=4&category=${categoryValue}`,
      ),
    );
    await expect(page.getByRole("heading", { level: 1, name: "Nuestros Bungalows" })).toBeVisible();
  });

  test("keeps the figma-inspired section rhythm for rooms, experiences, and testimonials", async ({
    page,
  }) => {
    await page.goto("/es");

    await expect(page.getByRole("heading", { level: 2, name: "Nuestros Bungalows" })).toBeVisible();
    await expect(page.locator('[data-home-section="room-grid-card"]')).toHaveCount(4);

    await expect(page.getByRole("heading", { name: "Experiencias unicas" })).toBeVisible();
    await expect(page.locator('[data-home-section="experience-card"]')).toHaveCount(3);

    await expect(page.getByRole("heading", { name: "Lo que dicen nuestros huespedes" })).toBeVisible();
    await expect(page.locator('[data-home-section="testimonial-card"]')).toHaveCount(3);

    await expect(page.getByRole("heading", { name: "Tu retiro en la selva te espera" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Solicitar reserva" }).last()).toHaveAttribute(
      "href",
      "/es/contact",
    );
  });

  test("keeps a three-image hero slider live on the public home", async ({ page }) => {
    await page.goto("/es");

    const hero = page.locator('section[aria-label="Hero principal de Wakaya"]');
    await expect(hero.locator('button[aria-label^="Go to slide "]')).toHaveCount(3);
  });

  test("keeps the bungalow request sidebar sticky while the detail content scrolls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto(
      "/es/bungalows/bungalow-familiar?category=bungalow-familiar&checkIn=2026-07-10&checkOut=2026-07-12&guests=4",
    );

    const sidebar = page.locator('aside[class*="detailSidebar"]');
    const before = await sidebar.boundingBox();

    expect(before).not.toBeNull();

    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(250);

    const after = await sidebar.boundingBox();

    expect(after).not.toBeNull();
    expect(after!.y).toBeGreaterThanOrEqual(104);
    expect(after!.y).toBeLessThanOrEqual(132);
  });

  test("uses the official footer logo and a larger public typography baseline", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1400 });
    await page.goto("/es");

    const footerLogo = page.locator('footer img[src="/images/wakaya/wakaya-logo-min.png"]');
    await expect(footerLogo).toBeVisible();

    const metrics = await page.evaluate(() => {
      const q = (selector: string) => document.querySelector(selector);
      const read = (selector: string) => {
        const node = q(selector);
        return node ? getComputedStyle(node).fontSize : null;
      };

      return {
        nav: read('a[class*="prototypeNavLink"]'),
        storyBody: read('[class*="storyCopy"] p'),
        footerIntro: read('footer p'),
        footerNav: read('footer a'),
      };
    });

    expect(Number.parseFloat(metrics.nav ?? "0")).toBeGreaterThanOrEqual(17.5);
    expect(Number.parseFloat(metrics.storyBody ?? "0")).toBeGreaterThanOrEqual(13);
    expect(Number.parseFloat(metrics.footerIntro ?? "0")).toBeGreaterThanOrEqual(15);
    expect(Number.parseFloat(metrics.footerNav ?? "0")).toBeGreaterThanOrEqual(15);
  });

  test("keeps stronger contrast on the home header bar and reserve CTA before hover", async ({ page }) => {
    await page.goto("/es");

    const metrics = await page.evaluate(() => {
      const bar = document.querySelector('[class*="prototypeBar"]');
      const cta = document.querySelector('a[class*="prototypeCta"]');

      return {
        barBackground: bar ? getComputedStyle(bar).backgroundColor : null,
        ctaBackground: cta ? getComputedStyle(cta).backgroundColor : null,
        ctaColor: cta ? getComputedStyle(cta).color : null,
        ctaBorder: cta ? getComputedStyle(cta).borderColor : null,
      };
    });

    expect(metrics.barBackground).not.toBe("rgba(0, 0, 0, 0)");
    expect(metrics.ctaBackground).not.toBe("rgba(0, 0, 0, 0)");
    expect(metrics.ctaColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(metrics.ctaBorder).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("renders the footer as a full-width band instead of a boxed block", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1400 });
    await page.goto("/es");

    const footer = page.locator("footer");
    const footerBox = await footer.boundingBox();
    const viewport = page.viewportSize();

    expect(footerBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(Math.abs(footerBox!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(footerBox!.width - viewport!.width)).toBeLessThanOrEqual(1);
  });

});

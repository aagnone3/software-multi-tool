import { config } from "@repo/config";
import { expect, test } from "./fixtures";

/**
 * Landing Page E2E Tests
 *
 * Tests for the marketing landing page including:
 * - All sections render correctly
 * - Responsive design (mobile, tablet, desktop)
 * - CTA functionality and navigation
 * - Accessibility requirements
 */
test.describe("landing page", () => {
	test.skip(!config.ui.marketing.enabled, "Marketing pages are disabled");

	test.describe("page rendering", () => {
		test("should display all main sections @smoke", async ({
			gotoAndWait,
			page,
		}) => {
			await gotoAndWait("/");

			// Hero section
			await expect(
				page.getByRole("heading", {
					name: /your one-stop shop for ai-powered business tools/i,
				}),
			).toBeVisible();

			// Features section
			await expect(
				page.getByRole("heading", {
					name: /powerful tools, simple to use/i,
				}),
			).toBeVisible();

			// How It Works section
			await expect(
				page.getByRole("heading", { name: /how it works/i }),
			).toBeVisible();

			// Final CTA section
			await expect(
				page.getByRole("heading", {
					name: /ready to transform your business with ai/i,
				}),
			).toBeVisible();
		});

		test("should display hero section with badge and CTAs", async ({
			gotoAndWait,
			page,
		}) => {
			await gotoAndWait("/");

			// Badge
			await expect(
				page.getByText(/ai-powered tools for small businesses/i),
			).toBeVisible();

			// Primary CTA
			await expect(
				page.getByRole("link", { name: /get started free/i }).first(),
			).toBeVisible();

			// Secondary CTA
			await expect(
				page.getByRole("link", { name: /see how it works/i }),
			).toBeVisible();

			// Tagline
			await expect(
				page.getByText(/no credit card required/i),
			).toBeVisible();
		});

		test("should display all 4 feature cards", async ({
			gotoAndWait,
			page,
		}) => {
			await gotoAndWait("/");

			const features = [
				"Document Summarization",
				"Audio Processing",
				"Productivity Enhancement",
				"General Automation",
			];

			for (const feature of features) {
				await expect(
					page.getByRole("heading", { name: feature }),
				).toBeVisible();
			}
		});

		test("should display all 4 how-it-works steps", async ({
			gotoAndWait,
			page,
		}) => {
			await gotoAndWait("/");

			const steps = [
				"Sign up for free",
				"Explore the tools",
				"Chat with AI",
				"Scale as you grow",
			];

			for (const step of steps) {
				await expect(
					page.getByRole("heading", { name: step }),
				).toBeVisible();
			}
		});

		test("should display final CTA with benefits", async ({
			gotoAndWait,
			page,
		}) => {
			await gotoAndWait("/");

			// Final CTA heading
			await expect(
				page.getByRole("heading", {
					name: /ready to transform your business with ai/i,
				}),
			).toBeVisible();

			// Benefits
			await expect(
				page.getByText("No credit card required").last(),
			).toBeVisible();
			await expect(
				page.getByText("Free credits to get started"),
			).toBeVisible();
			await expect(page.getByText("Cancel anytime")).toBeVisible();
		});
	});

	test.describe("CTA functionality", () => {
		test("hero 'Get Started Free' button should navigate to signup", async ({
			gotoAndWait,
			page,
		}) => {
			await gotoAndWait("/");

			const heroGetStarted = page
				.getByRole("link", { name: /get started free/i })
				.first();
			await heroGetStarted.click();

			await expect(page).toHaveURL(/\/auth\/signup/);
		});

		test("'See How It Works' button should scroll to section", async ({
			gotoAndWait,
			page,
		}) => {
			await gotoAndWait("/");

			const seeHowItWorks = page.getByRole("link", {
				name: /see how it works/i,
			});
			await seeHowItWorks.click();

			// Verify URL hash
			await expect(page).toHaveURL(/#how-it-works/);
		});

		test("final CTA 'Get Started Free' should navigate to signup", async ({
			gotoAndWait,
			page,
		}) => {
			await gotoAndWait("/");

			// Scroll to final CTA section
			const finalCta = page.getByRole("heading", {
				name: /ready to transform your business with ai/i,
			});
			await finalCta.scrollIntoViewIfNeeded();

			// Click the CTA in the final section (use last to target the one in FinalCta)
			const ctaButton = page
				.getByRole("link", { name: /get started free/i })
				.last();
			await ctaButton.click();

			await expect(page).toHaveURL(/\/auth\/signup/);
		});
	});

	test.describe("responsive design", () => {
		test("should render correctly on mobile viewport", async ({
			gotoAndWait,
			page,
		}) => {
			await page.setViewportSize({ width: 375, height: 667 });
			await gotoAndWait("/");

			// Hero should be visible
			await expect(
				page.getByRole("heading", {
					name: /your one-stop shop for ai-powered business tools/i,
				}),
			).toBeVisible();

			// Features should be visible
			await expect(
				page.getByRole("heading", {
					name: /powerful tools, simple to use/i,
				}),
			).toBeVisible();

			// How It Works should be visible
			await expect(
				page.getByRole("heading", { name: /how it works/i }),
			).toBeVisible();

			// Final CTA should be visible
			await expect(
				page.getByRole("heading", {
					name: /ready to transform your business with ai/i,
				}),
			).toBeVisible();
		});

		test("should render correctly on tablet viewport", async ({
			gotoAndWait,
			page,
		}) => {
			await page.setViewportSize({ width: 768, height: 1024 });
			await gotoAndWait("/");

			// All main sections should be visible
			await expect(
				page.getByRole("heading", {
					name: /your one-stop shop for ai-powered business tools/i,
				}),
			).toBeVisible();

			await expect(
				page.getByRole("heading", {
					name: /powerful tools, simple to use/i,
				}),
			).toBeVisible();
		});

		test("should render correctly on desktop viewport", async ({
			gotoAndWait,
			page,
		}) => {
			await page.setViewportSize({ width: 1440, height: 900 });
			await gotoAndWait("/");

			// All main sections should be visible
			await expect(
				page.getByRole("heading", {
					name: /your one-stop shop for ai-powered business tools/i,
				}),
			).toBeVisible();

			await expect(
				page.getByRole("heading", {
					name: /powerful tools, simple to use/i,
				}),
			).toBeVisible();
		});
	});

	test.describe("accessibility", () => {
		test("should have proper heading hierarchy", async ({
			gotoAndWait,
			page,
		}) => {
			await gotoAndWait("/");

			// Should have h1 for main heading
			const h1 = page.getByRole("heading", { level: 1 });
			await expect(h1).toBeVisible();

			// Should have h2 for section headings
			const h2s = page.getByRole("heading", { level: 2 });
			expect(await h2s.count()).toBeGreaterThanOrEqual(3);
		});

		test("should have accessible links with descriptive text", async ({
			gotoAndWait,
			page,
		}) => {
			await gotoAndWait("/");

			// Primary CTA links should be accessible
			const getStartedLinks = page.getByRole("link", {
				name: /get started free/i,
			});
			expect(await getStartedLinks.count()).toBeGreaterThanOrEqual(1);

			// All links should have accessible names
			const allLinks = page.getByRole("link");
			const linkCount = await allLinks.count();

			for (let i = 0; i < linkCount; i++) {
				const link = allLinks.nth(i);
				const accessibleName = await link.getAttribute("aria-label");
				const textContent = await link.textContent();

				// Link should have either aria-label or text content
				expect(accessibleName || textContent?.trim()).toBeTruthy();
			}
		});

		test("should be keyboard navigable", async ({ gotoAndWait, page }) => {
			await gotoAndWait("/");

			// Tab to first interactive element and verify focus
			await page.keyboard.press("Tab");

			// Should be able to focus on interactive elements
			const focusedElement = page.locator(":focus");
			await expect(focusedElement).toBeVisible();
		});
	});
});

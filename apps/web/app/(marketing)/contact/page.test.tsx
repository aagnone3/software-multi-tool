import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@marketing/home/components/ContactForm", () => ({
	ContactForm: () => <form data-testid="contact-form" />,
}));

vi.mock("@repo/config", () => ({
	config: {
		appName: "TestApp",
		contactForm: { enabled: true },
	},
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
	redirect: mockRedirect,
}));

describe("ContactPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders contact heading", async () => {
		const { default: ContactPage } = await import("./page");
		render(await ContactPage());
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
			"Contact us",
		);
	});

	it("renders contact form", async () => {
		const { default: ContactPage } = await import("./page");
		render(await ContactPage());
		expect(screen.getByTestId("contact-form")).toBeTruthy();
	});

	it("redirects to / when contact form is disabled", async () => {
		const { config } = await import("@repo/config");
		(config.contactForm as { enabled: boolean }).enabled = false;
		const { default: ContactPage } = await import("./page");
		await ContactPage();
		expect(mockRedirect).toHaveBeenCalledWith("/");
		// restore
		(config.contactForm as { enabled: boolean }).enabled = true;
	});

	it("generateMetadata returns correct title", async () => {
		const { generateMetadata } = await import("./page");
		const meta = await generateMetadata();
		expect(meta.title).toContain("Contact");
	});
});

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
	config: {
		appName: "TestApp",
	},
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://example.com",
}));

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => <div data-testid="sticky-cta" />,
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

describe("SecurityPage", () => {
	it("renders security heading", async () => {
		const { default: SecurityPage } = await import("./page");
		render(<SecurityPage />);
		expect(
			screen.getByRole("heading", { name: /security/i, level: 1 }),
		).toBeTruthy();
	});

	it("renders encryption section", async () => {
		const { default: SecurityPage } = await import("./page");
		render(<SecurityPage />);
		expect(screen.getByText(/encryption everywhere/i)).toBeTruthy();
	});

	it("renders file deletion pillar", async () => {
		const { default: SecurityPage } = await import("./page");
		render(<SecurityPage />);
		expect(
			screen.getByText(/files deleted after processing/i),
		).toBeTruthy();
	});

	it("renders sticky CTA", async () => {
		const { default: SecurityPage } = await import("./page");
		render(<SecurityPage />);
		expect(screen.getByTestId("sticky-cta")).toBeTruthy();
	});

	it("has metadata with security title", async () => {
		// metadata is a static export — just assert it's defined
		const { metadata } = await import("./page");
		expect(String(metadata.title)).toContain("Security");
	});
});

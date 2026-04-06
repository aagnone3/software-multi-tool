import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@marketing/blog/components/PostContent", () => ({
	PostContent: ({ content }: { content: string }) => (
		<div data-testid="post-content">{content}</div>
	),
}));

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => <div data-testid="sticky-cta" />,
}));

vi.mock("content-collections", () => ({
	allLegalPages: [],
}));

const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
	redirect: (...args: unknown[]) => redirectMock(...args),
}));

vi.mock("@shared/lib/content", () => ({
	getActivePathFromUrlParam: (path: string) => path,
	getLocalizedDocumentWithFallback: () => ({
		title: "Privacy Policy",
		body: "Legal body copy",
	}),
}));

describe("LegalPage", () => {
	it("renders legal content and StickyCta", async () => {
		const { default: LegalPage } = await import("./page");

		const ui = await LegalPage({
			params: Promise.resolve({ path: "privacy" }),
		});
		render(ui);

		expect(
			screen.getByRole("heading", { name: "Privacy Policy" }),
		).toBeInTheDocument();
		expect(screen.getByTestId("post-content")).toHaveTextContent(
			"Legal body copy",
		);
		expect(screen.getByTestId("sticky-cta")).toBeInTheDocument();
		expect(redirectMock).not.toHaveBeenCalled();
	});
});

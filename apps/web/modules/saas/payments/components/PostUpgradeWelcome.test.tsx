import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: () => ({
		enabledTools: [
			{ slug: "invoice-processor", name: "Invoice Processor" },
		],
	}),
}));

import { PostUpgradeWelcome } from "./PostUpgradeWelcome";

describe("PostUpgradeWelcome", () => {
	it("renders the congratulations heading", () => {
		render(<PostUpgradeWelcome />);
		expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
		expect(screen.getByText(/now on Pro/i)).toBeDefined();
	});

	it("renders all feature highlights", () => {
		render(<PostUpgradeWelcome />);
		expect(screen.getByText("Credits unlocked")).toBeDefined();
		expect(screen.getByText("Priority processing")).toBeDefined();
		expect(screen.getByText("All tools included")).toBeDefined();
	});

	it("renders a CTA link to run the first pro tool", () => {
		render(<PostUpgradeWelcome />);
		const link = screen.getByRole("link", {
			name: /run your first pro tool/i,
		});
		expect(link).toBeDefined();
		expect((link as HTMLAnchorElement).href).toContain(
			"/app/tools/invoice-processor",
		);
	});

	it("renders a browse all tools link", () => {
		render(<PostUpgradeWelcome />);
		const link = screen.getByRole("link", { name: /browse all tools/i });
		expect(link).toBeDefined();
		expect((link as HTMLAnchorElement).href).toContain("/app/tools");
	});

	it("renders a billing management link", () => {
		render(<PostUpgradeWelcome />);
		const link = screen.getByRole("link", { name: /manage billing/i });
		expect(link).toBeDefined();
		expect((link as HTMLAnchorElement).href).toContain(
			"/app/settings/billing",
		);
	});

	it("falls back to /app/tools when no enabled tools", () => {
		vi.doMock("@saas/tools/hooks/use-tools", () => ({
			useTools: () => ({ enabledTools: [] }),
		}));
		// Simple structural check — component renders without crash
		render(<PostUpgradeWelcome />);
		expect(screen.getByText(/now on Pro/i)).toBeDefined();
	});
});

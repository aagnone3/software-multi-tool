import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: () => ({
		enabledTools: [
			{ slug: "invoice-processor", name: "Invoice Processor" },
		],
	}),
}));

import { PostUpgradeWelcome } from "./PostUpgradeWelcome";

describe("PostUpgradeWelcome", () => {
	beforeEach(() => {
		mockTrack.mockClear();
	});

	it("fires post_upgrade_welcome_viewed on mount", () => {
		render(<PostUpgradeWelcome />);
		expect(
			mockTrack.mock.calls.some(
				([e]) => e.name === "post_upgrade_welcome_viewed",
			),
		).toBe(true);
	});

	it("fires post_upgrade_feature_cta_clicked when a feature CTA is clicked", async () => {
		render(<PostUpgradeWelcome />);
		const btn = screen.getByRole("link", { name: /try scheduler/i });
		await userEvent.click(btn);
		expect(
			mockTrack.mock.calls.some(
				([e]) =>
					e.name === "post_upgrade_feature_cta_clicked" &&
					e.props.feature === "Scheduler",
			),
		).toBe(true);
	});

	it("fires post_upgrade_next_step_clicked when a next step link is clicked", async () => {
		render(<PostUpgradeWelcome />);
		const link = screen.getByRole("link", { name: /run a tool/i });
		await userEvent.click(link);
		expect(
			mockTrack.mock.calls.some(
				([e]) =>
					e.name === "post_upgrade_next_step_clicked" &&
					e.props.step === 1,
			),
		).toBe(true);
	});

	it("fires post_upgrade_primary_cta_clicked when primary CTA is clicked", async () => {
		render(<PostUpgradeWelcome />);
		const btn = screen.getByRole("link", {
			name: /run your first pro tool/i,
		});
		await userEvent.click(btn);
		expect(
			mockTrack.mock.calls.some(
				([e]) =>
					e.name === "post_upgrade_primary_cta_clicked" &&
					e.props.tool_slug === "invoice-processor",
			),
		).toBe(true);
	});

	it("fires post_upgrade_secondary_cta_clicked when browse all tools is clicked", async () => {
		render(<PostUpgradeWelcome />);
		const btn = screen.getByRole("link", { name: /browse all tools/i });
		await userEvent.click(btn);
		expect(
			mockTrack.mock.calls.some(
				([e]) => e.name === "post_upgrade_secondary_cta_clicked",
			),
		).toBe(true);
	});

	it("renders the congratulations heading", () => {
		render(<PostUpgradeWelcome />);
		expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
		expect(screen.getByText(/now on Enterprise/i)).toBeDefined();
	});

	it("renders the included benefits list", () => {
		render(<PostUpgradeWelcome />);
		expect(screen.getByText(/500 credits\/month/i)).toBeDefined();
		expect(screen.getByText(/priority processing/i)).toBeDefined();
		expect(screen.getByText(/all tools unlocked/i)).toBeDefined();
	});

	it("renders all three Pro-exclusive feature cards", () => {
		render(<PostUpgradeWelcome />);
		expect(screen.getByText("Scheduler")).toBeDefined();
		expect(screen.getByText("Bulk Actions")).toBeDefined();
		expect(screen.getByText("Input Templates")).toBeDefined();
	});

	it("renders the suggested first steps checklist", () => {
		render(<PostUpgradeWelcome />);
		expect(screen.getByText(/Suggested first steps/i)).toBeDefined();
		expect(screen.getByText(/Run a tool/i)).toBeDefined();
		expect(screen.getByText(/Schedule a recurring run/i)).toBeDefined();
		expect(screen.getByText(/Save a template/i)).toBeDefined();
	});

	it("renders a CTA link to run the first pro tool with tool href", () => {
		render(<PostUpgradeWelcome />);
		const links = screen.getAllByRole("link", {
			name: /run your first pro tool/i,
		});
		expect(links.length).toBeGreaterThan(0);
		expect((links[0] as HTMLAnchorElement).href).toContain(
			"/app/tools/invoice-processor",
		);
	});

	it("renders a browse all tools link", () => {
		render(<PostUpgradeWelcome />);
		const links = screen.getAllByRole("link", {
			name: /browse all tools/i,
		});
		expect(links.length).toBeGreaterThan(0);
		expect((links[0] as HTMLAnchorElement).href).toContain("/app/tools");
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
		render(<PostUpgradeWelcome />);
		expect(screen.getByText(/now on Enterprise/i)).toBeDefined();
	});
});

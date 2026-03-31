import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolOutputExporter } from "./ToolOutputExporter";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: vi.fn(),
}));

import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";

const mockUseCreditsBalance = useCreditsBalance as ReturnType<typeof vi.fn>;

const mockData = { result: "test", value: 42 };

describe("ToolOutputExporter — Pro user", () => {
	beforeEach(() => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: false,
		});
	});

	it("renders Export button", () => {
		render(<ToolOutputExporter data={mockData} />);
		expect(screen.getByRole("button", { name: /export/i })).toBeTruthy();
	});

	it("opens dropdown with download options for Pro users", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolOutputExporter data={mockData} label="invoice" />);
		await user.click(screen.getByRole("button", { name: /export/i }));
		expect(screen.getByText("Copy as JSON")).toBeTruthy();
		expect(screen.getByText("Download JSON")).toBeTruthy();
		expect(screen.getByText("Download TXT")).toBeTruthy();
	});

	it("applies className prop", () => {
		render(<ToolOutputExporter data={mockData} className="my-class" />);
		const btn = screen.getByRole("button", { name: /export/i });
		expect(btn.className).toContain("my-class");
	});
});

describe("ToolOutputExporter — free plan user", () => {
	beforeEach(() => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
		});
	});

	it("shows copy option but no download options", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolOutputExporter data={mockData} />);
		await user.click(screen.getByRole("button", { name: /export/i }));
		expect(screen.getByText("Copy as JSON")).toBeTruthy();
		expect(screen.queryByText("Download JSON")).toBeNull();
		expect(screen.queryByText("Download TXT")).toBeNull();
	});

	it("shows upgrade prompt with link to pricing", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolOutputExporter data={mockData} />);
		await user.click(screen.getByRole("button", { name: /export/i }));
		expect(screen.getByText(/Downloads require Pro/i)).toBeTruthy();
		const upgradeLink = screen.getByText(/Upgrade to unlock downloads/i);
		expect(upgradeLink).toBeTruthy();
	});
});

describe("ToolOutputExporter — loading state", () => {
	it("shows download options while loading (optimistic for logged-out/anon)", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: true,
		});
		const user = userEvent.setup({ delay: null });
		render(<ToolOutputExporter data={mockData} />);
		await user.click(screen.getByRole("button", { name: /export/i }));
		// During loading, downloadsLocked = false → show download options
		expect(screen.getByText("Download JSON")).toBeTruthy();
	});
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolOutputExporter } from "./ToolOutputExporter";

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
	toast: {
		success: (...a: unknown[]) => mockToastSuccess(...a),
		error: (...a: unknown[]) => mockToastError(...a),
	},
}));

const mockUseCreditsBalance = vi.fn();
vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

// Stub clipboard
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", {
	value: { writeText: mockWriteText },
	writable: true,
});

describe("ToolOutputExporter", () => {
	const data = { foo: "bar", count: 42 };

	it("renders Export button", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: false,
		});
		render(<ToolOutputExporter data={data} />);
		expect(screen.getByText("Export")).toBeInTheDocument();
	});

	it("opens dropdown on click", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: false,
		});
		render(<ToolOutputExporter data={data} />);
		await userEvent.click(screen.getByText("Export"));
		expect(screen.getByText("Export results")).toBeInTheDocument();
		expect(screen.getByText("Copy as JSON")).toBeInTheDocument();
	});

	it("copies JSON to clipboard", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: false,
		});
		render(<ToolOutputExporter data={data} />);
		await userEvent.click(screen.getByText("Export"));
		await userEvent.click(screen.getByText("Copy as JSON"));
		expect(mockWriteText).toHaveBeenCalledWith(
			JSON.stringify(data, null, 2),
		);
		expect(mockToastSuccess).toHaveBeenCalledWith("Copied to clipboard");
	});

	it("shows download options for paid users", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: false,
		});
		render(<ToolOutputExporter data={data} />);
		await userEvent.click(screen.getByText("Export"));
		expect(screen.getByText("Download JSON")).toBeInTheDocument();
		expect(screen.getByText("Download TXT")).toBeInTheDocument();
	});

	it("shows upgrade prompt for free plan users", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
		});
		render(<ToolOutputExporter data={data} />);
		await userEvent.click(screen.getByText("Export"));
		expect(screen.getByText("Downloads require Pro")).toBeInTheDocument();
		expect(
			screen.getByText("Upgrade to unlock downloads"),
		).toBeInTheDocument();
	});

	it("hides download options for free plan users", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
		});
		render(<ToolOutputExporter data={data} />);
		await userEvent.click(screen.getByText("Export"));
		expect(screen.queryByText("Download JSON")).not.toBeInTheDocument();
	});
});

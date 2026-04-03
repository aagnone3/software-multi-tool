import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToolInputTemplates } from "./ToolInputTemplates";

const { mockToastSuccess, mockToastError, mockTrack } = vi.hoisted(() => ({
	mockToastSuccess: vi.fn(),
	mockToastError: vi.fn(),
	mockTrack: vi.fn(),
}));

// Mock sonner
vi.mock("sonner", () => ({
	toast: {
		success: mockToastSuccess,
		error: mockToastError,
	},
}));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

let mockWriteText: ReturnType<typeof vi.fn>;

describe("ToolInputTemplates", () => {
	beforeEach(() => {
		localStorage.clear();
		mockTrack.mockClear();
		mockWriteText = vi.fn().mockResolvedValue(undefined);
		// jsdom doesn't implement clipboard API; use defineProperty to override the getter
		Object.defineProperty(navigator, "clipboard", {
			get: () => ({ writeText: mockWriteText }),
			configurable: true,
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("renders header and empty state", () => {
		render(<ToolInputTemplates toolSlug="invoice-processor" />);
		expect(screen.getByText("Input Templates")).toBeTruthy();
		expect(screen.getByText(/No templates yet/)).toBeTruthy();
	});

	it("opens dialog on New button click", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolInputTemplates toolSlug="invoice-processor" />);
		await user.click(screen.getByRole("button", { name: /New/i }));
		expect(screen.getByLabelText("Template Name")).toBeTruthy();
		expect(screen.getByLabelText("Template Content")).toBeTruthy();
	});

	it("saves a new template", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolInputTemplates toolSlug="invoice-processor" />);
		await user.click(screen.getByRole("button", { name: /New/i }));
		await user.type(
			screen.getByLabelText("Template Name"),
			"Monthly report",
		);
		await user.type(
			screen.getByLabelText("Template Content"),
			"Jan 2026 expenses",
		);
		await user.click(
			screen.getByRole("button", { name: /Save Template/i }),
		);
		await waitFor(() => {
			expect(screen.getByText("Monthly report")).toBeTruthy();
		});
	});

	it("copies template content to clipboard and tracks event", async () => {
		// Pre-seed localStorage
		localStorage.setItem(
			"tool-input-templates",
			JSON.stringify({
				"invoice-processor": [
					{
						id: "tpl_1",
						name: "My template",
						content: "sample content",
						createdAt: 1,
					},
				],
			}),
		);
		const user = userEvent.setup({ delay: null });
		render(<ToolInputTemplates toolSlug="invoice-processor" />);
		await waitFor(() =>
			expect(screen.getByText("My template")).toBeTruthy(),
		);
		const copyBtn = screen.getByRole("button", {
			name: /Copy template My template to clipboard/i,
		});
		await user.click(copyBtn);
		await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled());
		await waitFor(() =>
			expect(mockTrack).toHaveBeenCalledWith({
				name: "template_copied",
				props: { toolSlug: "invoice-processor" },
			}),
		);
	});

	it("deletes a template and tracks event", async () => {
		localStorage.setItem(
			"tool-input-templates",
			JSON.stringify({
				"invoice-processor": [
					{
						id: "tpl_1",
						name: "Delete me",
						content: "content",
						createdAt: 1,
					},
				],
			}),
		);
		const user = userEvent.setup({ delay: null });
		render(<ToolInputTemplates toolSlug="invoice-processor" />);
		await waitFor(() => expect(screen.getByText("Delete me")).toBeTruthy());
		const deleteBtn = screen.getByRole("button", {
			name: /Delete template Delete me/i,
		});
		await user.click(deleteBtn);
		await waitFor(() => {
			expect(screen.queryByText("Delete me")).toBeNull();
		});
		expect(mockTrack).toHaveBeenCalledWith({
			name: "template_deleted",
			props: { toolSlug: "invoice-processor" },
		});
	});

	it("Save Template button is disabled when name or content is empty", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolInputTemplates toolSlug="invoice-processor" />);
		await user.click(screen.getByRole("button", { name: /New/i }));
		const saveBtn = screen.getByRole("button", { name: /Save Template/i });
		expect(saveBtn).toBeDisabled();
		await user.type(screen.getByLabelText("Template Name"), "name only");
		expect(saveBtn).toBeDisabled();
	});

	it("shows content preview truncated", async () => {
		const longContent = "A".repeat(100);
		localStorage.setItem(
			"tool-input-templates",
			JSON.stringify({
				"tool-x": [
					{
						id: "tpl_2",
						name: "Long one",
						content: longContent,
						createdAt: 2,
					},
				],
			}),
		);
		render(<ToolInputTemplates toolSlug="tool-x" />);
		await waitFor(() => expect(screen.getByText("Long one")).toBeTruthy());
		// truncated to 80 chars + ellipsis
		expect(screen.getByText(/A{80}…/)).toBeTruthy();
	});
});

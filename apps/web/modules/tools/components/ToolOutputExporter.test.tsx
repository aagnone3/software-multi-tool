import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolOutputExporter } from "./ToolOutputExporter";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockData = { result: "test", value: 42 };

describe("ToolOutputExporter", () => {
	it("renders Export button", () => {
		render(<ToolOutputExporter data={mockData} />);
		expect(screen.getByRole("button", { name: /export/i })).toBeTruthy();
	});

	it("opens dropdown with options on click", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolOutputExporter data={mockData} label="invoice" />);
		await user.click(screen.getByRole("button", { name: /export/i }));
		expect(screen.getByText("Copy as JSON")).toBeTruthy();
		expect(screen.getByText("Download JSON")).toBeTruthy();
		expect(screen.getByText("Download TXT")).toBeTruthy();
	});

	it("shows Copy as JSON and Download JSON options in dropdown", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolOutputExporter data={mockData} />);
		await user.click(screen.getByRole("button", { name: /export/i }));
		expect(screen.getByText("Copy as JSON")).toBeTruthy();
		expect(screen.getByText("Download JSON")).toBeTruthy();
	});

	it("applies className prop", () => {
		render(<ToolOutputExporter data={mockData} className="my-class" />);
		const btn = screen.getByRole("button", { name: /export/i });
		expect(btn.className).toContain("my-class");
	});
});

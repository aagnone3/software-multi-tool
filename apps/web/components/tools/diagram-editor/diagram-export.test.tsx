"use client";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiagramExport } from "./diagram-export";
import * as exportUtils from "./lib/export-utils";

vi.mock("next-themes", () => ({
	useTheme: () => ({ resolvedTheme: "light" }),
}));

const { toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
	toastErrorMock: vi.fn(),
	toastSuccessMock: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		success: toastSuccessMock,
		error: toastErrorMock,
	},
}));

vi.mock("./lib/export-utils", () => ({
	copyPngToClipboard: vi.fn().mockResolvedValue(undefined),
	copySvgToClipboard: vi.fn().mockResolvedValue(undefined),
	downloadPng: vi.fn().mockResolvedValue(undefined),
	downloadSvg: vi.fn().mockResolvedValue(undefined),
}));

describe("DiagramExport", () => {
	const mockDiv = document.createElement("div");
	const containerRef = { current: mockDiv };

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders Copy and Download buttons", () => {
		render(<DiagramExport containerRef={containerRef} />);
		expect(screen.getByText("Copy")).toBeInTheDocument();
		expect(screen.getByText("Download")).toBeInTheDocument();
	});

	it("shows disabled buttons when disabled=true", () => {
		render(<DiagramExport containerRef={containerRef} disabled />);
		const buttons = screen.getAllByRole("button");
		for (const button of buttons) {
			expect(button).toBeDisabled();
		}
	});

	it("opens copy dropdown and shows PNG and SVG options", async () => {
		const user = userEvent.setup({ delay: null });
		render(<DiagramExport containerRef={containerRef} />);
		await user.click(screen.getByText("Copy"));
		expect(screen.getByText("Copy as PNG")).toBeInTheDocument();
		expect(screen.getByText("Copy as SVG")).toBeInTheDocument();
	});

	it("calls copyPngToClipboard when Copy as PNG is clicked", async () => {
		const user = userEvent.setup({ delay: null });
		render(<DiagramExport containerRef={containerRef} />);
		await user.click(screen.getByText("Copy"));
		await user.click(screen.getByText("Copy as PNG"));
		expect(exportUtils.copyPngToClipboard).toHaveBeenCalled();
	});

	it("calls copySvgToClipboard when Copy as SVG is clicked", async () => {
		const user = userEvent.setup({ delay: null });
		render(<DiagramExport containerRef={containerRef} />);
		await user.click(screen.getByText("Copy"));
		await user.click(screen.getByText("Copy as SVG"));
		expect(exportUtils.copySvgToClipboard).toHaveBeenCalled();
	});

	it("opens download dropdown and shows PNG and SVG options", async () => {
		const user = userEvent.setup({ delay: null });
		render(<DiagramExport containerRef={containerRef} />);
		await user.click(screen.getByText("Download"));
		expect(screen.getByText("Download PNG")).toBeInTheDocument();
		expect(screen.getByText("Download SVG")).toBeInTheDocument();
	});

	it("calls downloadPng when Download PNG is clicked", async () => {
		const user = userEvent.setup({ delay: null });
		render(<DiagramExport containerRef={containerRef} />);
		await user.click(screen.getByText("Download"));
		await user.click(screen.getByText("Download PNG"));
		expect(exportUtils.downloadPng).toHaveBeenCalled();
	});

	it("does not call export util when containerRef is null", async () => {
		const user = userEvent.setup({ delay: null });
		const nullRef = { current: null };
		render(<DiagramExport containerRef={nullRef} />);
		await user.click(screen.getByText("Copy"));
		await user.click(screen.getByText("Copy as PNG"));
		// With null ref, handler returns early without calling export util
		expect(exportUtils.copyPngToClipboard).not.toHaveBeenCalled();
	});
});

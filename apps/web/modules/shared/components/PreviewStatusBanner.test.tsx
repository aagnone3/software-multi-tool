import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PreviewStatusBanner } from "./PreviewStatusBanner";

const mockUseApiStatus = vi.hoisted(() => vi.fn());

vi.mock("../hooks/use-api-status", () => ({
	useApiStatus: mockUseApiStatus,
}));

describe("PreviewStatusBanner", () => {
	it("renders null when not in preview", () => {
		mockUseApiStatus.mockReturnValue({
			isAvailable: false,
			isChecking: false,
			isPreview: false,
		});
		const { container } = render(<PreviewStatusBanner />);
		expect(container.firstChild).toBeNull();
	});

	it("renders null when API is available", () => {
		mockUseApiStatus.mockReturnValue({
			isAvailable: true,
			isChecking: false,
			isPreview: true,
		});
		const { container } = render(<PreviewStatusBanner />);
		expect(container.firstChild).toBeNull();
	});

	it("renders null when still checking", () => {
		mockUseApiStatus.mockReturnValue({
			isAvailable: false,
			isChecking: true,
			isPreview: true,
		});
		const { container } = render(<PreviewStatusBanner />);
		expect(container.firstChild).toBeNull();
	});

	it("renders banner in preview when API unavailable", () => {
		mockUseApiStatus.mockReturnValue({
			isAvailable: false,
			isChecking: false,
			isPreview: true,
		});
		render(<PreviewStatusBanner />);
		expect(screen.getByRole("alert")).toBeInTheDocument();
		expect(
			screen.getByText("Preview API initializing."),
		).toBeInTheDocument();
	});

	it("dismisses banner when X button clicked", () => {
		mockUseApiStatus.mockReturnValue({
			isAvailable: false,
			isChecking: false,
			isPreview: true,
		});
		render(<PreviewStatusBanner />);
		expect(screen.getByRole("alert")).toBeInTheDocument();
		fireEvent.click(screen.getByLabelText("Dismiss banner"));
		expect(screen.queryByRole("alert")).toBeNull();
	});
});

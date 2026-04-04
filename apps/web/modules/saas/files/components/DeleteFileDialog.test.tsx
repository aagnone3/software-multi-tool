import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { DeleteFileDialog } from "./DeleteFileDialog";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

describe("DeleteFileDialog", () => {
	const baseProps = {
		file: { id: "file-1", filename: "report.pdf" },
		isOpen: true,
		onClose: vi.fn(),
		onConfirm: vi.fn(),
		isDeleting: false,
	};

	it("renders the filename in the description", () => {
		render(<DeleteFileDialog {...baseProps} />);
		expect(screen.getByText("report.pdf")).toBeDefined();
	});

	it("renders title and action buttons", () => {
		render(<DeleteFileDialog {...baseProps} />);
		expect(screen.getByText("Delete file?")).toBeDefined();
		expect(screen.getByText("Delete")).toBeDefined();
		expect(screen.getByText("Cancel")).toBeDefined();
	});

	it("calls onConfirm when Delete is clicked", () => {
		const onConfirm = vi.fn();
		render(<DeleteFileDialog {...baseProps} onConfirm={onConfirm} />);
		fireEvent.click(screen.getByText("Delete"));
		expect(onConfirm).toHaveBeenCalledOnce();
	});

	it("shows Deleting... and disables buttons when isDeleting is true", () => {
		render(<DeleteFileDialog {...baseProps} isDeleting />);
		expect(screen.getByText("Deleting...")).toBeDefined();
		expect(screen.getByText("Cancel").closest("button")).toHaveProperty(
			"disabled",
			true,
		);
	});

	it("does not render content when not open", () => {
		render(<DeleteFileDialog {...baseProps} isOpen={false} />);
		expect(screen.queryByText("Delete file?")).toBeNull();
	});

	it("fires file_delete_confirmed analytics when Delete is clicked", () => {
		mockTrack.mockClear();
		render(<DeleteFileDialog {...baseProps} />);
		fireEvent.click(screen.getByText("Delete"));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "file_delete_confirmed",
			props: { file_id: "file-1" },
		});
	});
});

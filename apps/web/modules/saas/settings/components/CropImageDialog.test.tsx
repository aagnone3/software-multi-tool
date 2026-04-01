import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CropImageDialog } from "./CropImageDialog";

// Mock react-cropper since it relies on canvas APIs not available in jsdom
vi.mock("react-cropper", () => {
	const React = require("react");
	return {
		default: vi.fn(() =>
			React.createElement("div", { "data-testid": "mock-cropper" }),
		),
	};
});

// Mock URL.createObjectURL
const mockObjectUrl = "blob:mock-url";
const mockCreateObjectURL = vi.fn(() => mockObjectUrl);
Object.defineProperty(globalThis.URL, "createObjectURL", {
	value: mockCreateObjectURL,
	writable: true,
});

describe("CropImageDialog", () => {
	const onOpenChange = vi.fn();
	const onCrop = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders nothing visible when open=false", () => {
		render(
			<CropImageDialog
				image={null}
				open={false}
				onOpenChange={onOpenChange}
				onCrop={onCrop}
			/>,
		);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("renders the dialog when open=true", () => {
		render(
			<CropImageDialog
				image={null}
				open={true}
				onOpenChange={onOpenChange}
				onCrop={onCrop}
			/>,
		);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});

	it("shows Save button when open", () => {
		render(
			<CropImageDialog
				image={null}
				open={true}
				onOpenChange={onOpenChange}
				onCrop={onCrop}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /save/i }),
		).toBeInTheDocument();
	});

	it("renders the cropper when an image file is provided", () => {
		const file = new File(["bytes"], "test.png", { type: "image/png" });
		render(
			<CropImageDialog
				image={file}
				open={true}
				onOpenChange={onOpenChange}
				onCrop={onCrop}
			/>,
		);
		expect(screen.getByTestId("mock-cropper")).toBeInTheDocument();
	});

	it("does not render the cropper when image is null", () => {
		render(
			<CropImageDialog
				image={null}
				open={true}
				onOpenChange={onOpenChange}
				onCrop={onCrop}
			/>,
		);
		expect(screen.queryByTestId("mock-cropper")).not.toBeInTheDocument();
	});

	it("calls onOpenChange when dialog requests close", () => {
		render(
			<CropImageDialog
				image={null}
				open={true}
				onOpenChange={onOpenChange}
				onCrop={onCrop}
			/>,
		);
		// Press Escape to close the dialog
		fireEvent.keyDown(document.body, { key: "Escape", code: "Escape" });
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});

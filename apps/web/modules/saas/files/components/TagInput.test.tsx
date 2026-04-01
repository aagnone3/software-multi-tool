import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TagInput } from "./TagInput";

const { mockToastError } = vi.hoisted(() => ({
	mockToastError: vi.fn(),
}));
vi.mock("sonner", () => ({
	toast: { error: mockToastError, success: vi.fn() },
}));

const { mockAddTag, mockRemoveTag, mockInvalidateQueries } = vi.hoisted(() => ({
	mockAddTag: vi.fn(),
	mockRemoveTag: vi.fn(),
	mockInvalidateQueries: vi.fn(),
}));

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		files: {
			addTag: mockAddTag,
			removeTag: mockRemoveTag,
		},
	},
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: ({
		mutationFn,
		onSuccess,
		onError,
	}: {
		mutationFn: (arg: unknown) => Promise<unknown>;
		onSuccess?: (data: unknown) => void;
		onError?: (error: unknown) => void;
	}) => ({
		mutate: async (arg: unknown) => {
			try {
				const data = await mutationFn(arg);
				onSuccess?.(data);
			} catch (err) {
				onError?.(err);
			}
		},
		isPending: false,
	}),
	useQueryClient: () => ({
		invalidateQueries: mockInvalidateQueries,
	}),
}));

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		onClick,
		disabled,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		disabled?: boolean;
	}) => (
		<button type="button" onClick={onClick} disabled={disabled}>
			{children}
		</button>
	),
}));

vi.mock("@ui/components/dropdown-menu", () => ({
	DropdownMenu: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuTrigger: ({
		children,
	}: {
		children: React.ReactNode;
		asChild?: boolean;
	}) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuItem: ({
		children,
		onClick,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
	}) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
}));

const defaultProps = {
	fileId: "file-1",
	currentTags: [
		{ id: "tag-1", name: "urgent" },
		{ id: "tag-2", name: "review" },
	],
	availableTags: [
		{ id: "tag-1", name: "urgent" },
		{ id: "tag-2", name: "review" },
		{ id: "tag-3", name: "archive" },
	],
	onClose: vi.fn(),
};

beforeEach(() => {
	vi.clearAllMocks();
	mockAddTag.mockResolvedValue({});
	mockRemoveTag.mockResolvedValue({});
});

describe("TagInput", () => {
	it("renders current tags", () => {
		render(<TagInput {...defaultProps} />);
		expect(screen.getByText("urgent")).toBeDefined();
		expect(screen.getByText("review")).toBeDefined();
	});

	it("shows only unused tags as suggestions", () => {
		render(<TagInput {...defaultProps} />);
		// "archive" is in availableTags but not in currentTags, so it should appear as a suggestion
		expect(screen.getByText("archive")).toBeDefined();
		// "urgent" and "review" are already in currentTags, not in suggested
		// They do appear as current tags but not in the dropdown suggestions area
	});

	it("calls onClose when clicking outside", () => {
		const onClose = vi.fn();
		render(<TagInput {...defaultProps} onClose={onClose} />);
		// Simulate a mousedown on a random non-container element
		fireEvent.mouseDown(document.body);
		expect(onClose).toHaveBeenCalled();
	});

	it("renders Add button when not in adding mode", () => {
		render(<TagInput {...defaultProps} />);
		expect(screen.getByText("Add")).toBeDefined();
	});

	it("shows input when 'Create new tag...' is clicked", () => {
		render(<TagInput {...defaultProps} />);
		const createButton = screen.getByText("Create new tag...");
		fireEvent.click(createButton);
		const input = screen.getByPlaceholderText("Tag name...");
		expect(input).toBeDefined();
	});

	it("calls addTag when Enter is pressed on tag input", async () => {
		render(<TagInput {...defaultProps} />);
		fireEvent.click(screen.getByText("Create new tag..."));
		const input = screen.getByPlaceholderText("Tag name...");
		fireEvent.change(input, { target: { value: "new-tag" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(mockAddTag).toHaveBeenCalledWith({
			fileId: "file-1",
			tagName: "new-tag",
		});
	});

	it("hides input when Escape is pressed", () => {
		render(<TagInput {...defaultProps} />);
		fireEvent.click(screen.getByText("Create new tag..."));
		const input = screen.getByPlaceholderText("Tag name...");
		fireEvent.keyDown(input, { key: "Escape" });
		expect(screen.queryByPlaceholderText("Tag name...")).toBeNull();
	});

	it("shows error toast when addTag fails", async () => {
		mockAddTag.mockRejectedValue(new Error("network error"));
		render(<TagInput {...defaultProps} />);
		fireEvent.click(screen.getByText("Create new tag..."));
		const input = screen.getByPlaceholderText("Tag name...");
		fireEvent.change(input, { target: { value: "bad-tag" } });
		fireEvent.keyDown(input, { key: "Enter" });
		// Wait for async mutation
		await new Promise((r) => setTimeout(r, 0));
		expect(mockToastError).toHaveBeenCalledWith(
			"Failed to add tag. Please try again.",
		);
	});
});

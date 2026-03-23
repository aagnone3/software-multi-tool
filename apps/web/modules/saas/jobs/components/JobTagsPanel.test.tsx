import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JobTagsPanel } from "./JobTagsPanel";

vi.mock("@tools/hooks/use-job-tags", () => ({
	useJobTags: vi.fn(() => ({
		tags: ["bug", "review"],
		addTag: vi.fn(),
		removeTag: vi.fn(),
	})),
}));

describe("JobTagsPanel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders tags section heading", () => {
		render(<JobTagsPanel jobId="job-1" />);
		expect(screen.getByText("Tags")).toBeInTheDocument();
	});

	it("renders existing tags as badges", () => {
		render(<JobTagsPanel jobId="job-1" />);
		expect(screen.getByText("bug")).toBeInTheDocument();
		expect(screen.getByText("review")).toBeInTheDocument();
	});

	it("renders remove buttons for each tag", () => {
		render(<JobTagsPanel jobId="job-1" />);
		expect(screen.getByLabelText("Remove tag bug")).toBeInTheDocument();
		expect(screen.getByLabelText("Remove tag review")).toBeInTheDocument();
	});

	it("renders tag input and Add button", () => {
		render(<JobTagsPanel jobId="job-1" />);
		expect(screen.getByLabelText("New tag")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
	});

	it("shows no tags message when tags empty", async () => {
		const { useJobTags } = await import("@tools/hooks/use-job-tags");
		vi.mocked(useJobTags).mockReturnValue({
			tags: [],
			addTag: vi.fn(),
			removeTag: vi.fn(),
		});
		render(<JobTagsPanel jobId="job-1" />);
		expect(screen.getByText("No tags yet")).toBeInTheDocument();
	});

	it("calls addTag on Enter key press", async () => {
		const addTag = vi.fn();
		const { useJobTags } = await import("@tools/hooks/use-job-tags");
		vi.mocked(useJobTags).mockReturnValue({
			tags: [],
			addTag,
			removeTag: vi.fn(),
		});
		render(<JobTagsPanel jobId="job-1" />);
		const user = userEvent.setup({ delay: null });
		const input = screen.getByLabelText("New tag");
		await user.type(input, "urgent{Enter}");
		expect(addTag).toHaveBeenCalledWith("urgent");
	});
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JobTagsPanel } from "./JobTagsPanel";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@tools/hooks/use-job-tags", () => ({
	useJobTags: vi.fn(() => ({
		tags: ["bug", "review"],
		addTag: vi.fn(),
		removeTag: vi.fn(),
		getAllTags: vi.fn().mockReturnValue([]),
		hasTag: vi.fn().mockReturnValue(false),
		getTagsForJob: vi.fn().mockReturnValue([]),
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
			getAllTags: vi.fn().mockReturnValue([]),
			hasTag: vi.fn().mockReturnValue(false),
			getTagsForJob: vi.fn().mockReturnValue([]),
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
			getAllTags: vi.fn().mockReturnValue([]),
			hasTag: vi.fn().mockReturnValue(false),
			getTagsForJob: vi.fn().mockReturnValue([]),
		});
		render(<JobTagsPanel jobId="job-1" />);
		const user = userEvent.setup({ delay: null });
		const input = screen.getByLabelText("New tag");
		await user.type(input, "urgent{Enter}");
		expect(addTag).toHaveBeenCalledWith("urgent");
	});

	it("tracks job_tag_added when a tag is added", async () => {
		mockTrack.mockClear();
		const addTag = vi.fn();
		const { useJobTags } = await import("@tools/hooks/use-job-tags");
		vi.mocked(useJobTags).mockReturnValue({
			tags: [],
			addTag,
			removeTag: vi.fn(),
			getAllTags: vi.fn().mockReturnValue([]),
			hasTag: vi.fn().mockReturnValue(false),
			getTagsForJob: vi.fn().mockReturnValue([]),
		});
		render(<JobTagsPanel jobId="job-analytics" />);
		const user = userEvent.setup({ delay: null });
		await user.type(screen.getByLabelText("New tag"), "urgent");
		await user.click(screen.getByRole("button", { name: /add/i }));
		expect(mockTrack).toHaveBeenCalledWith(
			expect.objectContaining({ name: "job_tag_added" }),
		);
	});

	it("tracks job_tag_removed when a tag is removed", async () => {
		mockTrack.mockClear();
		const { useJobTags } = await import("@tools/hooks/use-job-tags");
		vi.mocked(useJobTags).mockReturnValue({
			tags: ["bug", "review"],
			addTag: vi.fn(),
			removeTag: vi.fn(),
			getAllTags: vi.fn().mockReturnValue([]),
			hasTag: vi.fn().mockReturnValue(false),
			getTagsForJob: vi.fn().mockReturnValue([]),
		});
		render(<JobTagsPanel jobId="job-analytics" />);
		const removeBtn = screen.getByLabelText("Remove tag bug");
		await userEvent.click(removeBtn);
		expect(mockTrack).toHaveBeenCalledWith(
			expect.objectContaining({ name: "job_tag_removed" }),
		);
	});
});

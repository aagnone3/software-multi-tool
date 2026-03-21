import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- mocks ---

const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockGetForJobQueryFn = vi.fn();

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		feedback: {
			getForJob: {
				queryOptions: (opts: unknown) => ({
					queryKey: ["feedback-getForJob", opts],
					queryFn: mockGetForJobQueryFn,
				}),
			},
			create: {
				mutationOptions: () => ({}),
			},
			update: {
				mutationOptions: () => ({}),
			},
		},
	},
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@tanstack/react-query")>();
	return {
		...actual,
		useMutation: vi.fn((opts: { mutationFn?: unknown }) => {
			// distinguish create vs update by checking a marker we'll set
			const isUpdate = (opts as any).__isUpdate;
			return {
				mutateAsync: isUpdate
					? mockUpdateMutateAsync
					: mockCreateMutateAsync,
				isPending: false,
			};
		}),
	};
});

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { ToolFeedback } from "./ToolFeedback";

// Override orpc mutation options to carry a marker so useMutation mock can distinguish them
// Actually the simpler approach: re-mock useMutation per-test or use call order
// Let's use a different strategy: mock both at module level via the orpc mock

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
};

describe("ToolFeedback", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetForJobQueryFn.mockResolvedValue({ feedback: null });
		mockCreateMutateAsync.mockResolvedValue({ feedback: { id: "new-id" } });
		mockUpdateMutateAsync.mockResolvedValue({
			feedback: { id: "updated-id" },
		});
	});

	it("renders card variant by default with feedback controls", () => {
		render(<ToolFeedback toolSlug="news-analyzer" />, {
			wrapper: createWrapper(),
		});

		expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
		expect(screen.getByTitle("This was helpful")).toBeInTheDocument();
		expect(screen.getByTitle("This wasn't helpful")).toBeInTheDocument();
	});

	it("renders inline variant without card container", () => {
		const { container } = render(
			<ToolFeedback toolSlug="news-analyzer" variant="inline" />,
			{ wrapper: createWrapper() },
		);

		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper.className).not.toContain("rounded-lg border");
	});

	it("renders card variant with styled container", () => {
		const { container } = render(
			<ToolFeedback toolSlug="news-analyzer" variant="card" />,
			{ wrapper: createWrapper() },
		);

		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper.className).toContain("rounded-lg border");
	});

	it("renders thumbs up and thumbs down buttons", () => {
		render(<ToolFeedback toolSlug="news-analyzer" />, {
			wrapper: createWrapper(),
		});

		const upButton = screen.getByTitle("This was helpful");
		const downButton = screen.getByTitle("This wasn't helpful");
		expect(upButton).toBeInTheDocument();
		expect(downButton).toBeInTheDocument();
	});

	it("calls toast error on mutation failure", async () => {
		mockCreateMutateAsync.mockRejectedValueOnce(new Error("Server error"));

		render(<ToolFeedback toolSlug="news-analyzer" />, {
			wrapper: createWrapper(),
		});

		fireEvent.click(screen.getByTitle("This was helpful"));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Failed to submit feedback. Please try again.",
			);
		});
	});

	it("shows 'Was this helpful?' label", () => {
		render(<ToolFeedback toolSlug="news-analyzer" />, {
			wrapper: createWrapper(),
		});
		expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
	});

	it("accepts custom className", () => {
		const { container } = render(
			<ToolFeedback toolSlug="news-analyzer" className="custom-class" />,
			{ wrapper: createWrapper() },
		);
		expect(container.querySelector(".custom-class")).toBeInTheDocument();
	});
});

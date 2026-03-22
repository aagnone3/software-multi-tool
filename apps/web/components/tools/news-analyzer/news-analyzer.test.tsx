import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks
const _mutateAsyncMock = vi.hoisted(() => vi.fn());
const useMutationMock = vi.hoisted(() => vi.fn());
const routerPushMock = vi.hoisted(() => vi.fn());
const localStorageGetMock = vi.hoisted(() => vi.fn());
const localStorageSetMock = vi.hoisted(() => vi.fn());
const orpcClientMock = vi.hoisted(() => ({
	jobs: {
		create: vi.fn(),
		get: vi.fn(),
	},
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: useMutationMock,
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: orpcClientMock,
}));

// Mock child components
vi.mock("./news-analyzer-form", () => ({
	NewsAnalyzerForm: ({
		onSubmit,
		isLoading,
	}: {
		onSubmit: (data: { articleUrl?: string; articleText?: string }) => void;
		isLoading: boolean;
	}) => (
		<div>
			<span data-testid="loading-state">
				{isLoading ? "loading" : "idle"}
			</span>
			<button
				type="button"
				onClick={() => onSubmit({ articleUrl: "https://example.com" })}
			>
				Submit
			</button>
		</div>
	),
}));

import { NewsAnalyzer } from "./news-analyzer";

describe("NewsAnalyzer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("localStorage", {
			getItem: localStorageGetMock,
			setItem: localStorageSetMock,
		});

		// Default mutation mock: idle state
		useMutationMock.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
		});
	});

	it("renders the news analyzer form", () => {
		render(<NewsAnalyzer />);
		expect(screen.getByText("Submit")).toBeInTheDocument();
	});

	it("shows idle loading state initially", () => {
		render(<NewsAnalyzer />);
		expect(screen.getByTestId("loading-state")).toHaveTextContent("idle");
	});

	it("shows loading state when mutation is pending", () => {
		useMutationMock.mockReturnValue({
			mutate: vi.fn(),
			isPending: true,
		});
		render(<NewsAnalyzer />);
		expect(screen.getByTestId("loading-state")).toHaveTextContent(
			"loading",
		);
	});

	it("displays error message on mutation failure", async () => {
		let onError: (err: Error) => void = () => {};
		useMutationMock.mockImplementation(({ onError: oe }) => {
			onError = oe;
			return { mutate: vi.fn(), isPending: false };
		});

		render(<NewsAnalyzer />);

		// Trigger onError callback
		onError(new Error("Failed to create job"));

		await waitFor(() => {
			expect(
				screen.getByText("Failed to create job"),
			).toBeInTheDocument();
		});
	});

	it("shows generic error when non-Error thrown", async () => {
		let onError: (err: unknown) => void = () => {};
		useMutationMock.mockImplementation(({ onError: oe }) => {
			onError = oe;
			return { mutate: vi.fn(), isPending: false };
		});

		render(<NewsAnalyzer />);
		onError("some string error");

		await waitFor(() => {
			expect(
				screen.getByText("Failed to create analysis job"),
			).toBeInTheDocument();
		});
	});

	it("navigates to detail page when job completes immediately", async () => {
		let onSuccess: (data: {
			job: {
				id: string;
				status: string;
				output: object | null;
				error: string | null;
			};
		}) => void = () => {};
		useMutationMock.mockImplementation(({ onSuccess: os }) => {
			onSuccess = os;
			return { mutate: vi.fn(), isPending: false };
		});

		render(<NewsAnalyzer />);

		onSuccess({
			job: {
				id: "job-123",
				status: "COMPLETED",
				output: { headline: "Test" },
				error: null,
			},
		});

		await waitFor(() => {
			expect(routerPushMock).toHaveBeenCalledWith(
				"/app/tools/news-analyzer/job-123",
			);
		});
	});

	it("shows failed error when job fails immediately", async () => {
		let onSuccess: (data: {
			job: {
				id: string;
				status: string;
				output: object | null;
				error: string | null;
			};
		}) => void = () => {};
		useMutationMock.mockImplementation(({ onSuccess: os }) => {
			onSuccess = os;
			return { mutate: vi.fn(), isPending: false };
		});

		render(<NewsAnalyzer />);

		onSuccess({
			job: {
				id: "job-123",
				status: "FAILED",
				output: null,
				error: "Extraction failed",
			},
		});

		await waitFor(() => {
			expect(screen.getByText("Extraction failed")).toBeInTheDocument();
		});
	});

	it("reads session id from localStorage on form submit", async () => {
		const user = userEvent.setup({ delay: null });
		const mutateMock = vi.fn();
		useMutationMock.mockReturnValue({
			mutate: mutateMock,
			isPending: false,
		});
		localStorageGetMock.mockReturnValue("existing-session-id");

		render(<NewsAnalyzer />);
		await user.click(screen.getByText("Submit"));

		expect(mutateMock).toHaveBeenCalledWith({
			articleUrl: "https://example.com",
		});
	});

	it("creates session id in localStorage if not present", async () => {
		const user = userEvent.setup({ delay: null });
		type MutationFn = (input: unknown) => Promise<unknown>;
		let capturedMutationFn: MutationFn | undefined;
		useMutationMock.mockImplementation(
			({ mutationFn }: { mutationFn: MutationFn }) => {
				capturedMutationFn = mutationFn;
				return { mutate: vi.fn(), isPending: false };
			},
		);
		localStorageGetMock.mockReturnValue(null);
		orpcClientMock.jobs.create.mockResolvedValue({
			job: { id: "j1", status: "PENDING", output: null, error: null },
		});

		render(<NewsAnalyzer />);
		await user.click(screen.getByText("Submit"));

		// Call the real mutationFn to exercise localStorage.setItem
		if (capturedMutationFn) {
			await (capturedMutationFn as MutationFn)({
				articleUrl: "https://example.com",
			});
		}

		expect(localStorageSetMock).toHaveBeenCalled();
	});
});

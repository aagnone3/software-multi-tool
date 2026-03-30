import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SpeakerSeparationDetail } from "./speaker-separation-detail";

const useQueryMock = vi.hoisted(() => vi.fn());
const useMutationMock = vi.hoisted(() =>
	vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
);
const useRouterMock = vi.hoisted(() =>
	vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
);
const useQueryClientMock = vi.hoisted(() =>
	vi.fn(() => ({ invalidateQueries: vi.fn() })),
);

vi.mock("@tanstack/react-query", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@tanstack/react-query")>();
	return {
		...actual,
		useQuery: useQueryMock,
		useMutation: useMutationMock,
		useQueryClient: useQueryClientMock,
	};
});

vi.mock("next/navigation", () => ({
	useRouter: useRouterMock,
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: { jobs: { create: vi.fn(), delete: vi.fn() } },
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		jobs: {
			get: {
				queryOptions: vi.fn(() => ({
					queryKey: ["jobs", "get"],
					queryFn: vi.fn(),
				})),
			},
		},
	},
}));

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: vi.fn(() => ({ isFreePlan: false, isLoading: false })),
}));
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: vi.fn(() => ({ activeOrganization: null })),
}));
vi.mock("next-themes", () => ({
	useTheme: vi.fn(() => ({ resolvedTheme: "light" })),
}));

vi.mock("@shared/components/ToolFeedback", () => ({
	ToolFeedback: () => <div>ToolFeedback</div>,
}));

describe("SpeakerSeparationDetail", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		useMutationMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
		useRouterMock.mockReturnValue({ push: vi.fn(), back: vi.fn() });
		useQueryClientMock.mockReturnValue({ invalidateQueries: vi.fn() });
	});

	it("renders loading state", () => {
		useQueryMock.mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
		});
		render(<SpeakerSeparationDetail jobId="job-1" />);
		expect(screen.getByText(/loading analysis/i)).toBeInTheDocument();
	});

	it("renders error state when query fails", () => {
		useQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: new Error("Not found"),
		});
		render(<SpeakerSeparationDetail jobId="job-1" />);
		expect(screen.getByText(/not found/i)).toBeInTheDocument();
	});

	it("renders error state when job is missing", () => {
		useQueryMock.mockReturnValue({
			data: { job: null },
			isLoading: false,
			error: null,
		});
		render(<SpeakerSeparationDetail jobId="job-1" />);
		expect(
			screen.getByText(/failed to load analysis/i),
		).toBeInTheDocument();
	});

	it("renders PENDING job status", () => {
		useQueryMock.mockReturnValue({
			data: {
				job: {
					id: "job-1",
					status: "PENDING",
					createdAt: new Date().toISOString(),
					input: {},
					output: null,
					error: null,
					audioFileUrl: null,
					audioMetadata: null,
				},
			},
			isLoading: false,
			error: null,
		});
		render(<SpeakerSeparationDetail jobId="job-1" />);
		expect(screen.getByText(/pending/i)).toBeInTheDocument();
	});

	it("renders FAILED job status with error message", () => {
		useQueryMock.mockReturnValue({
			data: {
				job: {
					id: "job-1",
					status: "FAILED",
					createdAt: new Date().toISOString(),
					input: {},
					output: null,
					error: "Processing failed due to audio quality",
					audioFileUrl: null,
					audioMetadata: null,
				},
			},
			isLoading: false,
			error: null,
		});
		render(<SpeakerSeparationDetail jobId="job-1" />);
		expect(
			screen.getByText(/processing failed due to audio quality/i),
		).toBeInTheDocument();
	});

	it("renders COMPLETED job with speaker data", () => {
		useQueryMock.mockReturnValue({
			data: {
				job: {
					id: "job-1",
					status: "COMPLETED",
					createdAt: new Date().toISOString(),
					input: { audioFileUrl: "https://example.com/audio.mp3" },
					output: {
						transcript: "Hello world",
						segments: [
							{
								speakerLabel: "SPEAKER_0",
								speakerIndex: 0,
								startTime: 0,
								endTime: 2.5,
								text: "Hello",
							},
						],
						speakers: [
							{
								id: "SPEAKER_0",
								label: "Speaker 1",
								color: "#3b82f6",
								percentage: 100,
							},
						],
						duration: 2.5,
					},
					error: null,
					audioFileUrl: null,
					audioMetadata: null,
				},
			},
			isLoading: false,
			error: null,
		});
		render(<SpeakerSeparationDetail jobId="job-1" />);
		expect(screen.getAllByText(/completed/i).length).toBeGreaterThan(0);
	});
});

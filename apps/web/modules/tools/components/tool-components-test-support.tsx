import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { vi } from "vitest";

export const mockMutateAsync = vi.fn();
export const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockRouterPush,
		replace: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
	}),
	usePathname: () => "/app/tools/speaker-separation",
	useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../hooks/use-job-polling", () => ({
	useCreateJob: () => ({
		mutateAsync: mockMutateAsync,
		isPending: false,
	}),
	useJobPolling: () => ({
		job: undefined,
		isLoading: false,
		error: null,
		refetch: vi.fn(),
		invalidateJob: vi.fn(),
	}),
	useCancelJob: () => ({
		mutateAsync: vi.fn(),
		isPending: false,
	}),
	useJobsList: () => ({
		jobs: [],
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
}));

vi.mock("./JobProgressIndicator", () => ({
	JobProgressIndicator: () => <div data-testid="job-progress-indicator" />,
}));

export const createQueryWrapper = () => {
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

export const mockTrack = vi.fn();

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

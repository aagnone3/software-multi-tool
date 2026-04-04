import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Next.js Link - preserve className for styling tests
vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		className,
		onClick,
	}: {
		children: ReactNode;
		href: string;
		className?: string;
		onClick?: React.MouseEventHandler<HTMLAnchorElement>;
	}) => React.createElement("a", { href, className, onClick }, children),
}));

// Mock Radix Tooltip components
vi.mock("@ui/components/tooltip", () => ({
	Tooltip: ({ children }: { children: ReactNode }) =>
		React.createElement("div", { "data-testid": "tooltip" }, children),
	TooltipContent: ({ children }: { children: ReactNode }) =>
		React.createElement(
			"div",
			{ "data-testid": "tooltip-content" },
			children,
		),
	TooltipProvider: ({ children }: { children: ReactNode }) =>
		React.createElement(
			"div",
			{ "data-testid": "tooltip-provider" },
			children,
		),
	TooltipTrigger: ({
		children,
	}: {
		children: ReactNode;
		asChild?: boolean;
	}) =>
		React.createElement(
			"div",
			{ "data-testid": "tooltip-trigger" },
			children,
		),
}));

// Mock the useCreditsBalance hook
const mockUseCreditsBalance = vi.fn();
vi.mock("../hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { CreditBalanceIndicator } from "./CreditBalanceIndicator";

describe("CreditBalanceIndicator", () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders placeholder when no active organization", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: undefined,
			isLoading: false,
			isLowCredits: false,
			hasActiveOrganization: false,
		});

		render(<CreditBalanceIndicator />, { wrapper });

		// Should show the placeholder div with opacity-50 class
		const placeholder = screen.getByText("--");
		expect(placeholder).toBeInTheDocument();
		// The container should have opacity-50 class indicating disabled state
		expect(placeholder.parentElement).toHaveClass("opacity-50");
	});

	it("renders loading state when organization is set but data is loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: undefined,
			isLoading: true,
			isLowCredits: false,
			hasActiveOrganization: true,
		});

		render(<CreditBalanceIndicator />, { wrapper });

		// Should show loading placeholder with animate-pulse
		const placeholder = screen.getByText("--");
		expect(placeholder).toBeInTheDocument();
		expect(placeholder.parentElement).toHaveClass("animate-pulse");
	});

	it("renders null when organization is set but no balance data", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: undefined,
			isLoading: false,
			isLowCredits: false,
			hasActiveOrganization: true,
		});

		const { container } = render(<CreditBalanceIndicator />, { wrapper });

		// Should render nothing
		expect(container.firstChild).toBeNull();
	});

	it("renders balance correctly when organization and balance are set", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 75,
				remaining: 50,
				purchasedCredits: 25,
			},
			isLoading: false,
			isLowCredits: false,
			hasActiveOrganization: true,
		});

		render(<CreditBalanceIndicator />, { wrapper });

		// Should show the balance value
		expect(screen.getByText("75")).toBeInTheDocument();
	});

	it("renders with destructive styling when low on credits", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 10,
				remaining: 5,
				purchasedCredits: 5,
			},
			isLoading: false,
			isLowCredits: true,
			hasActiveOrganization: true,
		});

		const { container } = render(<CreditBalanceIndicator />, { wrapper });

		// Should show the balance value
		const balanceText = screen.getByText("10");
		expect(balanceText).toBeInTheDocument();

		// The link should have destructive styling
		// With mocked Tooltip components, the Link is rendered directly
		const link = container.querySelector("a");
		expect(link).toBeInTheDocument();
		// Check that the class attribute includes the destructive styles
		expect(link?.getAttribute("class")).toContain("text-destructive");
	});

	it("links to billing settings", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 75,
				remaining: 50,
				purchasedCredits: 25,
			},
			isLoading: false,
			isLowCredits: false,
			hasActiveOrganization: true,
		});

		render(<CreditBalanceIndicator />, { wrapper });

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/app/settings/billing");
	});

	it("tracks credit_balance_indicator_clicked event on click", async () => {
		const user = userEvent.setup();
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 42,
				remaining: 30,
				purchasedCredits: 12,
			},
			isLoading: false,
			isLowCredits: false,
			hasActiveOrganization: true,
			isApiInitializing: false,
		});

		render(<CreditBalanceIndicator />, { wrapper });

		const link = screen.getByRole("link");
		await user.click(link);

		expect(mockTrack).toHaveBeenCalledWith({
			name: "credit_balance_indicator_clicked",
			props: {
				is_low_credits: false,
				balance: 42,
			},
		});
	});
});

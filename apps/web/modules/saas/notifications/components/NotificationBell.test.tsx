import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the API hooks
const mockUseNotificationsUnreadCountQuery = vi.fn();

vi.mock("../lib/api", () => ({
	useNotificationsUnreadCountQuery: () =>
		mockUseNotificationsUnreadCountQuery(),
	useNotificationsQuery: () => ({
		data: { notifications: [], total: 0, unreadCount: 0 },
		isLoading: false,
		isError: false,
	}),
	useMarkNotificationAsReadMutation: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
	useMarkAllNotificationsAsReadMutation: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
	useDeleteNotificationMutation: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
}));

// Import components after mocking
import { NotificationBell } from "./NotificationBell";

describe("NotificationBell", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});

		// Default mock implementation
		mockUseNotificationsUnreadCountQuery.mockReturnValue({
			data: { unreadCount: 0 },
			isLoading: false,
		});

		vi.clearAllMocks();
	});

	const createWrapper = () => {
		return ({ children }: { children: ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);
	};

	it("renders bell icon button", () => {
		render(<NotificationBell />, { wrapper: createWrapper() });

		const button = screen.getByRole("button", { name: /notifications/i });
		expect(button).toBeInTheDocument();
	});

	it("does not show badge when unread count is 0", () => {
		mockUseNotificationsUnreadCountQuery.mockReturnValue({
			data: { unreadCount: 0 },
			isLoading: false,
		});

		const { container } = render(<NotificationBell />, {
			wrapper: createWrapper(),
		});

		// The badge should not be in the document
		const badge = container.querySelector(".bg-primary.rounded-full");
		expect(badge).not.toBeInTheDocument();
	});

	it("shows badge with unread count", () => {
		mockUseNotificationsUnreadCountQuery.mockReturnValue({
			data: { unreadCount: 5 },
			isLoading: false,
		});

		render(<NotificationBell />, { wrapper: createWrapper() });

		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("shows 99+ when unread count exceeds 99", () => {
		mockUseNotificationsUnreadCountQuery.mockReturnValue({
			data: { unreadCount: 150 },
			isLoading: false,
		});

		render(<NotificationBell />, { wrapper: createWrapper() });

		expect(screen.getByText("99+")).toBeInTheDocument();
	});

	it("includes unread count in aria-label when there are unread notifications", () => {
		mockUseNotificationsUnreadCountQuery.mockReturnValue({
			data: { unreadCount: 5 },
			isLoading: false,
		});

		render(<NotificationBell />, { wrapper: createWrapper() });

		const button = screen.getByRole("button");
		expect(button).toHaveAttribute(
			"aria-label",
			"Notifications (5 unread)",
		);
	});

	it("has no unread count in aria-label when there are no unread notifications", () => {
		mockUseNotificationsUnreadCountQuery.mockReturnValue({
			data: { unreadCount: 0 },
			isLoading: false,
		});

		render(<NotificationBell />, { wrapper: createWrapper() });

		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("aria-label", "Notifications");
	});

	it("bell button is interactive", () => {
		render(<NotificationBell />, { wrapper: createWrapper() });

		const button = screen.getByRole("button", { name: /notifications/i });

		// Button should be clickable (no errors thrown)
		fireEvent.click(button);

		// Button should still be in the document after click
		expect(button).toBeInTheDocument();
	});

	it("applies correct styling to badge for single digit counts", () => {
		mockUseNotificationsUnreadCountQuery.mockReturnValue({
			data: { unreadCount: 5 },
			isLoading: false,
		});

		const { container } = render(<NotificationBell />, {
			wrapper: createWrapper(),
		});

		const badge = container.querySelector(".size-4");
		expect(badge).toBeInTheDocument();
	});

	it("applies correct styling to badge for double digit counts", () => {
		mockUseNotificationsUnreadCountQuery.mockReturnValue({
			data: { unreadCount: 25 },
			isLoading: false,
		});

		const { container } = render(<NotificationBell />, {
			wrapper: createWrapper(),
		});

		const badge = container.querySelector(".h-5.min-w-5");
		expect(badge).toBeInTheDocument();
	});

	it("handles undefined data gracefully", () => {
		mockUseNotificationsUnreadCountQuery.mockReturnValue({
			data: undefined,
			isLoading: true,
		});

		const { container } = render(<NotificationBell />, {
			wrapper: createWrapper(),
		});

		// Should render without badge when data is undefined
		const badge = container.querySelector(".bg-primary.rounded-full");
		expect(badge).not.toBeInTheDocument();
	});
});

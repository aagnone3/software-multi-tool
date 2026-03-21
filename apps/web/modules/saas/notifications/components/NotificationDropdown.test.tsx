import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseNotificationsQuery = vi.hoisted(() => vi.fn());
const mockMarkAsReadMutate = vi.hoisted(() => vi.fn());
const mockMarkAllAsReadMutate = vi.hoisted(() => vi.fn());
const mockDeleteMutate = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
	useNotificationsQuery: mockUseNotificationsQuery,
	useMarkNotificationAsReadMutation: () => ({
		mutate: mockMarkAsReadMutate,
		isPending: false,
	}),
	useMarkAllNotificationsAsReadMutation: () => ({
		mutate: mockMarkAllAsReadMutate,
		isPending: false,
	}),
	useDeleteNotificationMutation: () => ({
		mutate: mockDeleteMutate,
		isPending: false,
	}),
}));

vi.mock("./NotificationItem", () => ({
	NotificationItem: ({
		id,
		title,
		onMarkAsRead,
		onDelete,
	}: {
		id: string;
		title: string;
		onMarkAsRead?: (id: string) => void;
		onDelete?: (id: string) => void;
	}) => (
		<div data-testid={`notification-${id}`}>
			<span>{title}</span>
			<button type="button" onClick={() => onMarkAsRead?.(id)}>
				Mark read
			</button>
			<button type="button" onClick={() => onDelete?.(id)}>
				Delete
			</button>
		</div>
	),
}));

vi.mock("@shared/components/Spinner", () => ({
	Spinner: ({ className }: { className?: string }) => (
		<div data-testid="spinner" className={className} />
	),
}));

import { NotificationDropdown } from "./NotificationDropdown";

function createQueryClient() {
	return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderComponent(props = {}) {
	return render(
		<QueryClientProvider client={createQueryClient()}>
			<NotificationDropdown {...props} />
		</QueryClientProvider>,
	);
}

describe("NotificationDropdown", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows loading spinner when loading", () => {
		mockUseNotificationsQuery.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
		});
		renderComponent();
		expect(screen.getByTestId("spinner")).toBeDefined();
	});

	it("shows error message when error", () => {
		mockUseNotificationsQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
		});
		renderComponent();
		expect(screen.getByText("Failed to load notifications")).toBeDefined();
	});

	it("shows empty state when no notifications", () => {
		mockUseNotificationsQuery.mockReturnValue({
			data: { notifications: [], unreadCount: 0 },
			isLoading: false,
			isError: false,
		});
		renderComponent();
		expect(screen.getByText("No notifications yet")).toBeDefined();
	});

	it("renders notifications when data present", () => {
		mockUseNotificationsQuery.mockReturnValue({
			data: {
				notifications: [
					{
						id: "n1",
						type: "info",
						title: "Test Notification",
						body: "body",
						actionUrl: null,
						read: false,
						createdAt: new Date(),
					},
				],
				unreadCount: 1,
			},
			isLoading: false,
			isError: false,
		});
		renderComponent();
		expect(screen.getByTestId("notification-n1")).toBeDefined();
		expect(screen.getByText("Test Notification")).toBeDefined();
	});

	it("shows mark all as read button when unread count > 0", () => {
		mockUseNotificationsQuery.mockReturnValue({
			data: {
				notifications: [
					{
						id: "n1",
						type: "info",
						title: "Test",
						body: "body",
						actionUrl: null,
						read: false,
						createdAt: new Date(),
					},
				],
				unreadCount: 1,
			},
			isLoading: false,
			isError: false,
		});
		renderComponent();
		const markAllBtn = screen.getByText("Mark all as read");
		expect(markAllBtn).toBeDefined();
		fireEvent.click(markAllBtn);
		expect(mockMarkAllAsReadMutate).toHaveBeenCalled();
	});

	it("does not show mark all as read when unreadCount is 0", () => {
		mockUseNotificationsQuery.mockReturnValue({
			data: { notifications: [], unreadCount: 0 },
			isLoading: false,
			isError: false,
		});
		renderComponent();
		expect(screen.queryByText("Mark all as read")).toBeNull();
	});

	it("calls onClose when notification with actionUrl is marked as read", () => {
		const onClose = vi.fn();
		mockUseNotificationsQuery.mockReturnValue({
			data: {
				notifications: [
					{
						id: "n1",
						type: "info",
						title: "Actionable",
						body: "body",
						actionUrl: "https://example.com",
						read: false,
						createdAt: new Date(),
					},
				],
				unreadCount: 1,
			},
			isLoading: false,
			isError: false,
		});
		renderComponent({ onClose });
		fireEvent.click(screen.getByText("Mark read"));
		expect(mockMarkAsReadMutate).toHaveBeenCalledWith("n1");
		expect(onClose).toHaveBeenCalled();
	});

	it("calls delete mutate when notification deleted", () => {
		mockUseNotificationsQuery.mockReturnValue({
			data: {
				notifications: [
					{
						id: "n1",
						type: "info",
						title: "Delete me",
						body: "body",
						actionUrl: null,
						read: false,
						createdAt: new Date(),
					},
				],
				unreadCount: 0,
			},
			isLoading: false,
			isError: false,
		});
		renderComponent();
		fireEvent.click(screen.getByText("Delete"));
		expect(mockDeleteMutate).toHaveBeenCalledWith("n1");
	});
});

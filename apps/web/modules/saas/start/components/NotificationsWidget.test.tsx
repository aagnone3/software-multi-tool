import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsWidget } from "./NotificationsWidget";

const mockMarkAsRead = vi.fn();
const mockRouterPush = vi.fn();
const mockTrack = vi.fn();

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("@saas/notifications/lib/api", () => ({
	useNotificationsQuery: vi.fn(),
	useNotificationsUnreadCountQuery: vi.fn(),
	useMarkNotificationAsReadMutation: vi.fn(),
}));

import {
	useMarkNotificationAsReadMutation,
	useNotificationsQuery,
	useNotificationsUnreadCountQuery,
} from "@saas/notifications/lib/api";

const mockNotifications = [
	{
		id: "n1",
		type: "info",
		title: "Info notification",
		read: false,
		createdAt: new Date(Date.now() - 60000).toISOString(),
		actionUrl: "/app/settings",
	},
	{
		id: "n2",
		type: "success",
		title: "Success notification",
		read: true,
		createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
		actionUrl: null,
	},
	{
		id: "n3",
		type: "warning",
		title: "Warning notification",
		read: false,
		createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
		actionUrl: null,
	},
];

function setupMocks({
	isLoading = false,
	notifications = mockNotifications,
	unreadCount = 2,
}: {
	isLoading?: boolean;
	notifications?: typeof mockNotifications;
	unreadCount?: number;
} = {}) {
	vi.mocked(useNotificationsQuery).mockReturnValue({
		data: { notifications },
		isLoading,
	} as unknown as ReturnType<typeof useNotificationsQuery>);
	vi.mocked(useNotificationsUnreadCountQuery).mockReturnValue({
		data: { unreadCount },
	} as unknown as ReturnType<typeof useNotificationsUnreadCountQuery>);
	vi.mocked(useMarkNotificationAsReadMutation).mockReturnValue({
		mutate: mockMarkAsRead,
	} as unknown as ReturnType<typeof useMarkNotificationAsReadMutation>);
}

describe("NotificationsWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders loading state", () => {
		setupMocks({ isLoading: true });
		const { container } = render(<NotificationsWidget />);
		expect(container.querySelector(".animate-pulse")).toBeTruthy();
	});

	it("renders empty state when no notifications", () => {
		setupMocks({ notifications: [], unreadCount: 0 });
		render(<NotificationsWidget />);
		expect(screen.getByText("No notifications yet")).toBeInTheDocument();
	});

	it("shows unread badge count", () => {
		setupMocks({ unreadCount: 3 });
		render(<NotificationsWidget />);
		expect(screen.getByText("3")).toBeInTheDocument();
		expect(screen.getByText("3 unread notifications")).toBeInTheDocument();
	});

	it("shows singular unread notification text", () => {
		setupMocks({ unreadCount: 1 });
		render(<NotificationsWidget />);
		expect(screen.getByText("1 unread notification")).toBeInTheDocument();
	});

	it("shows 'Your recent notifications' when no unread", () => {
		setupMocks({ unreadCount: 0 });
		render(<NotificationsWidget />);
		expect(
			screen.getByText("Your recent notifications"),
		).toBeInTheDocument();
	});

	it("renders notification titles", () => {
		setupMocks();
		render(<NotificationsWidget />);
		expect(screen.getByText("Info notification")).toBeInTheDocument();
		expect(screen.getByText("Success notification")).toBeInTheDocument();
	});

	it("marks unread notification as read on click", async () => {
		setupMocks();
		render(<NotificationsWidget />);
		const btn = screen.getByText("Info notification").closest("button")!;
		await userEvent.click(btn);
		expect(mockMarkAsRead).toHaveBeenCalledWith("n1");
	});

	it("does not call markAsRead for already read notification", async () => {
		setupMocks();
		render(<NotificationsWidget />);
		const btn = screen.getByText("Success notification").closest("button")!;
		await userEvent.click(btn);
		expect(mockMarkAsRead).not.toHaveBeenCalled();
	});

	it("navigates to actionUrl on click", async () => {
		setupMocks();
		render(<NotificationsWidget />);
		const btn = screen.getByText("Info notification").closest("button")!;
		await userEvent.click(btn);
		expect(mockRouterPush).toHaveBeenCalledWith("/app/settings");
	});

	it("tracks analytics when a notification is clicked", async () => {
		setupMocks();
		render(<NotificationsWidget />);
		const btn = screen.getByText("Info notification").closest("button")!;
		await userEvent.click(btn);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "dashboard_notification_clicked",
			props: {
				notification_id: "n1",
				notification_type: "info",
				was_unread: true,
			},
		});
	});

	it("shows view all link", () => {
		setupMocks();
		render(<NotificationsWidget />);
		expect(screen.getByText("View all notifications")).toBeInTheDocument();
	});

	it("respects maxItems prop", () => {
		const notifications = [
			...mockNotifications,
			{
				id: "n4",
				type: "error",
				title: "Error notification",
				read: false,
				createdAt: new Date().toISOString(),
				actionUrl: null,
			},
		];
		vi.mocked(useNotificationsQuery).mockReturnValue({
			data: { notifications: notifications.slice(0, 2) },
			isLoading: false,
		} as unknown as ReturnType<typeof useNotificationsQuery>);
		vi.mocked(useNotificationsUnreadCountQuery).mockReturnValue({
			data: { unreadCount: 1 },
		} as unknown as ReturnType<typeof useNotificationsUnreadCountQuery>);
		vi.mocked(useMarkNotificationAsReadMutation).mockReturnValue({
			mutate: mockMarkAsRead,
		} as unknown as ReturnType<typeof useMarkNotificationAsReadMutation>);
		render(<NotificationsWidget maxItems={2} />);
		expect(
			screen.queryByText("Error notification"),
		).not.toBeInTheDocument();
	});
});

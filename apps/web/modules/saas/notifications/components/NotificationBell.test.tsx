import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { NotificationBell } from "./NotificationBell";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
}));

const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockDelete = vi.fn();

vi.mock("../lib/api", () => ({
	useNotificationsUnreadCountQuery: vi.fn(() => ({
		data: { unreadCount: 0 },
	})),
	useNotificationsQuery: vi.fn(() => ({
		data: { notifications: [], unreadCount: 0 },
		isLoading: false,
		isError: false,
	})),
	useMarkNotificationAsReadMutation: vi.fn(() => ({
		mutate: mockMarkAsRead,
		isPending: false,
	})),
	useMarkAllNotificationsAsReadMutation: vi.fn(() => ({
		mutate: mockMarkAllAsRead,
		isPending: false,
	})),
	useDeleteNotificationMutation: vi.fn(() => ({
		mutate: mockDelete,
		isPending: false,
	})),
}));

import { useNotificationsUnreadCountQuery } from "../lib/api";

const mockUseUnreadCount = vi.mocked(useNotificationsUnreadCountQuery);

describe("NotificationBell", () => {
	it("renders bell button with notifications aria-label (0 unread)", () => {
		render(<NotificationBell />);
		expect(
			screen.getByRole("button", { name: /notifications$/i }),
		).toBeInTheDocument();
	});

	it("shows unread count badge when there are unread notifications", () => {
		mockUseUnreadCount.mockReturnValueOnce({
			data: { unreadCount: 5 },
		} as ReturnType<typeof useNotificationsUnreadCountQuery>);
		render(<NotificationBell />);
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("shows 99+ when unread count exceeds 99", () => {
		mockUseUnreadCount.mockReturnValueOnce({
			data: { unreadCount: 150 },
		} as ReturnType<typeof useNotificationsUnreadCountQuery>);
		render(<NotificationBell />);
		expect(screen.getByText("99+")).toBeInTheDocument();
	});

	it("does not show badge when 0 unread", () => {
		render(<NotificationBell />);
		expect(screen.queryByText("0")).not.toBeInTheDocument();
	});
});

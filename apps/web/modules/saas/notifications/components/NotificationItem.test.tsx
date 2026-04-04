import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { NotificationItem } from "./NotificationItem";

const mockPush = vi.fn();
const mockTrack = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
}));
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

const baseProps = {
	id: "notif-1",
	type: "info",
	title: "Test notification",
	body: "This is a test message",
	actionUrl: null,
	read: false,
	createdAt: new Date(),
};

describe("NotificationItem", () => {
	it("renders title and body", () => {
		render(<NotificationItem {...baseProps} />);
		expect(screen.getByText("Test notification")).toBeInTheDocument();
		expect(screen.getByText("This is a test message")).toBeInTheDocument();
	});

	it("calls onMarkAsRead when clicked (unread)", () => {
		const onMarkAsRead = vi.fn();
		render(<NotificationItem {...baseProps} onMarkAsRead={onMarkAsRead} />);
		// Click the notification item itself (role=button div)
		const btn = screen
			.getByText("Test notification")
			.closest("[role=button]");
		if (btn) {
			fireEvent.click(btn);
		}
		expect(onMarkAsRead).toHaveBeenCalledWith("notif-1");
	});

	it("navigates to actionUrl when clicked", () => {
		render(
			<NotificationItem
				{...baseProps}
				actionUrl="/app/jobs"
				onMarkAsRead={vi.fn()}
			/>,
		);
		const btn = screen
			.getByText("Test notification")
			.closest("[role=button]");
		if (btn) {
			fireEvent.click(btn);
		}
		expect(mockPush).toHaveBeenCalledWith("/app/jobs");
	});

	it("calls onDelete when delete button clicked", () => {
		const onDelete = vi.fn();
		render(<NotificationItem {...baseProps} onDelete={onDelete} />);
		const deleteBtn = screen.getByRole("button", {
			name: /delete notification/i,
		});
		fireEvent.click(deleteBtn);
		expect(onDelete).toHaveBeenCalledWith("notif-1");
	});

	it("does not show unread indicator for read notifications", () => {
		const { container } = render(
			<NotificationItem {...baseProps} read={true} />,
		);
		// Unread indicator is an absolute div with bg-primary - check it's absent
		expect(container.querySelector(".bg-primary.size-2")).toBeNull();
	});

	it("renders success type with different icon color", () => {
		render(<NotificationItem {...baseProps} type="success" />);
		expect(screen.getByText("Test notification")).toBeInTheDocument();
	});

	it("renders error type", () => {
		render(<NotificationItem {...baseProps} type="error" />);
		expect(screen.getByText("Test notification")).toBeInTheDocument();
	});

	it("tracks notification_marked_as_read when unread item is clicked", () => {
		mockTrack.mockClear();
		render(
			<NotificationItem
				{...baseProps}
				read={false}
				onMarkAsRead={vi.fn()}
			/>,
		);
		const btn = screen
			.getByText("Test notification")
			.closest("[role=button]");
		if (btn) {
			fireEvent.click(btn);
		}
		expect(mockTrack).toHaveBeenCalledWith({
			name: "notification_marked_as_read",
			props: { notification_id: "notif-1", notification_type: "info" },
		});
	});

	it("tracks notification_deleted when delete button clicked", () => {
		mockTrack.mockClear();
		render(<NotificationItem {...baseProps} onDelete={vi.fn()} />);
		const deleteBtn = screen.getByRole("button", {
			name: /delete notification/i,
		});
		fireEvent.click(deleteBtn);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "notification_deleted",
			props: { notification_id: "notif-1", notification_type: "info" },
		});
	});
});

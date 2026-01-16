import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationItem } from "./NotificationItem";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
}));

describe("NotificationItem", () => {
	const mockPush = vi.fn();
	const mockOnMarkAsRead = vi.fn();
	const mockOnDelete = vi.fn();

	const defaultProps = {
		id: "notif-1",
		type: "info",
		title: "Test Notification",
		body: "This is a test notification body",
		actionUrl: "/app/settings",
		read: false,
		createdAt: new Date(),
		onMarkAsRead: mockOnMarkAsRead,
		onDelete: mockOnDelete,
	};

	beforeEach(() => {
		vi.mocked(useRouter).mockReturnValue({
			push: mockPush,
			back: vi.fn(),
			forward: vi.fn(),
			refresh: vi.fn(),
			replace: vi.fn(),
			prefetch: vi.fn(),
		} as ReturnType<typeof useRouter>);
		vi.clearAllMocks();
	});

	it("renders notification title and body", () => {
		render(<NotificationItem {...defaultProps} />);

		expect(screen.getByText("Test Notification")).toBeInTheDocument();
		expect(
			screen.getByText("This is a test notification body"),
		).toBeInTheDocument();
	});

	it("shows unread indicator for unread notifications", () => {
		const { container } = render(
			<NotificationItem {...defaultProps} read={false} />,
		);

		const unreadDot = container.querySelector(".bg-primary.size-2");
		expect(unreadDot).toBeInTheDocument();
	});

	it("hides unread indicator for read notifications", () => {
		const { container } = render(
			<NotificationItem {...defaultProps} read={true} />,
		);

		const unreadDot = container.querySelector(".bg-primary.size-2");
		expect(unreadDot).not.toBeInTheDocument();
	});

	it("applies different styles for unread vs read notifications", () => {
		const { container: unreadContainer } = render(
			<NotificationItem {...defaultProps} read={false} />,
		);

		const { container: readContainer } = render(
			<NotificationItem {...defaultProps} read={true} />,
		);

		const unreadRoot = unreadContainer.firstChild as HTMLElement;
		const readRoot = readContainer.firstChild as HTMLElement;

		expect(unreadRoot.className).toContain("bg-primary/5");
		expect(readRoot.className).not.toContain("bg-primary/5");
	});

	it("calls onMarkAsRead and navigates when clicking an unread notification", () => {
		const { container } = render(
			<NotificationItem {...defaultProps} read={false} />,
		);

		// Get the main notification div (first button role)
		const notification = container.firstChild as HTMLElement;
		fireEvent.click(notification);

		expect(mockOnMarkAsRead).toHaveBeenCalledWith("notif-1");
		expect(mockPush).toHaveBeenCalledWith("/app/settings");
	});

	it("does not call onMarkAsRead for already read notifications", () => {
		const { container } = render(
			<NotificationItem {...defaultProps} read={true} />,
		);

		const notification = container.firstChild as HTMLElement;
		fireEvent.click(notification);

		expect(mockOnMarkAsRead).not.toHaveBeenCalled();
		expect(mockPush).toHaveBeenCalledWith("/app/settings");
	});

	it("does not navigate when actionUrl is null", () => {
		const { container } = render(
			<NotificationItem {...defaultProps} actionUrl={null} />,
		);

		const notification = container.firstChild as HTMLElement;
		fireEvent.click(notification);

		expect(mockPush).not.toHaveBeenCalled();
	});

	it("calls onDelete when clicking delete button", () => {
		render(<NotificationItem {...defaultProps} />);

		const deleteButton = screen.getByLabelText("Delete notification");
		fireEvent.click(deleteButton);

		expect(mockOnDelete).toHaveBeenCalledWith("notif-1");
	});

	it("does not trigger notification click when clicking delete", () => {
		render(<NotificationItem {...defaultProps} />);

		const deleteButton = screen.getByLabelText("Delete notification");
		fireEvent.click(deleteButton);

		expect(mockOnMarkAsRead).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("renders correct icon for info type", () => {
		const { container } = render(
			<NotificationItem {...defaultProps} type="info" />,
		);

		const icon = container.querySelector(".text-primary svg");
		expect(icon).toBeInTheDocument();
	});

	it("renders correct icon for success type", () => {
		const { container } = render(
			<NotificationItem {...defaultProps} type="success" />,
		);

		const icon = container.querySelector(".text-emerald-500 svg");
		expect(icon).toBeInTheDocument();
	});

	it("renders correct icon for warning type", () => {
		const { container } = render(
			<NotificationItem {...defaultProps} type="warning" />,
		);

		const icon = container.querySelector(".text-amber-500 svg");
		expect(icon).toBeInTheDocument();
	});

	it("renders correct icon for error type", () => {
		const { container } = render(
			<NotificationItem {...defaultProps} type="error" />,
		);

		const icon = container.querySelector(".text-rose-500 svg");
		expect(icon).toBeInTheDocument();
	});

	it("displays time ago correctly for recent notifications", () => {
		const now = new Date();
		render(<NotificationItem {...defaultProps} createdAt={now} />);

		expect(screen.getByText("just now")).toBeInTheDocument();
	});

	it("displays time ago correctly for notifications from hours ago", () => {
		const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
		render(<NotificationItem {...defaultProps} createdAt={twoHoursAgo} />);

		expect(screen.getByText("2h ago")).toBeInTheDocument();
	});

	it("displays time ago correctly for notifications from days ago", () => {
		const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
		render(<NotificationItem {...defaultProps} createdAt={threeDaysAgo} />);

		expect(screen.getByText("3d ago")).toBeInTheDocument();
	});

	it("handles keyboard navigation with Enter key", () => {
		const { container } = render(<NotificationItem {...defaultProps} />);

		const notification = container.firstChild as HTMLElement;
		fireEvent.keyDown(notification, { key: "Enter" });

		expect(mockOnMarkAsRead).toHaveBeenCalledWith("notif-1");
		expect(mockPush).toHaveBeenCalledWith("/app/settings");
	});

	it("handles keyboard navigation with Space key", () => {
		const { container } = render(<NotificationItem {...defaultProps} />);

		const notification = container.firstChild as HTMLElement;
		fireEvent.keyDown(notification, { key: " " });

		expect(mockOnMarkAsRead).toHaveBeenCalledWith("notif-1");
		expect(mockPush).toHaveBeenCalledWith("/app/settings");
	});

	it("falls back to info icon for unknown notification type", () => {
		const { container } = render(
			<NotificationItem {...defaultProps} type="unknown" />,
		);

		const icon = container.querySelector(".text-primary svg");
		expect(icon).toBeInTheDocument();
	});
});

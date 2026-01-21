import { beforeEach, describe, expect, it, vi } from "vitest";
import { securityNotifications } from "./security-notifications";

// Mock dependencies
const createNotificationMock = vi.hoisted(() => vi.fn());
const getUserByIdMock = vi.hoisted(() => vi.fn());
const shouldSendNotificationMock = vi.hoisted(() => vi.fn());
const sendEmailMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	createNotification: createNotificationMock,
	getUserById: getUserByIdMock,
	shouldSendNotification: shouldSendNotificationMock,
}));

vi.mock("@repo/mail", () => ({
	sendEmail: sendEmailMock,
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://app.example.com",
}));

vi.mock("@repo/logs", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

describe("securityNotifications", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("passwordChanged", () => {
		it("sends in-app notification when preference allows", async () => {
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await securityNotifications.passwordChanged({ userId: "user-123" });

			expect(shouldSendNotificationMock).toHaveBeenCalledWith(
				"user-123",
				"security",
				"inApp",
			);
			expect(createNotificationMock).toHaveBeenCalledWith({
				userId: "user-123",
				type: "info",
				category: "security",
				title: "Password Changed",
				body: expect.stringContaining("password has been changed"),
				actionUrl: "https://app.example.com/app/settings/account",
			});
		});

		it("sends email notification when preference allows", async () => {
			shouldSendNotificationMock.mockResolvedValue(true);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });
			getUserByIdMock.mockResolvedValue({
				id: "user-123",
				email: "user@example.com",
			});
			sendEmailMock.mockResolvedValue(true);

			await securityNotifications.passwordChanged({ userId: "user-123" });

			expect(sendEmailMock).toHaveBeenCalledWith({
				to: "user@example.com",
				templateId: "notificationEmail",
				context: {
					title: "Password Changed",
					body: expect.stringContaining("password has been changed"),
					actionUrl: "https://app.example.com/app/settings/account",
					actionLabel: "Security Settings",
				},
			});
		});

		it("does not send notifications when preferences are disabled", async () => {
			shouldSendNotificationMock.mockResolvedValue(false);

			await securityNotifications.passwordChanged({ userId: "user-123" });

			expect(createNotificationMock).not.toHaveBeenCalled();
			expect(sendEmailMock).not.toHaveBeenCalled();
		});
	});

	describe("twoFactorEnabled", () => {
		it("sends success notification with correct content", async () => {
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await securityNotifications.twoFactorEnabled({
				userId: "user-123",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "success",
					title: "Two-Factor Authentication Enabled",
					body: expect.stringContaining("has been enabled"),
				}),
			);
		});
	});

	describe("twoFactorDisabled", () => {
		it("sends warning notification with correct content", async () => {
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await securityNotifications.twoFactorDisabled({
				userId: "user-123",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "warning",
					title: "Two-Factor Authentication Disabled",
					body: expect.stringContaining("has been disabled"),
				}),
			);
		});
	});

	describe("newLoginDetected", () => {
		it("sends notification with device info when provided", async () => {
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await securityNotifications.newLoginDetected({
				userId: "user-123",
				deviceInfo: "Chrome on macOS",
				location: "New York, US",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "New Login Detected",
					body: expect.stringContaining("Chrome on macOS"),
				}),
			);
			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining("New York, US"),
				}),
			);
		});

		it("sends notification without device info when not provided", async () => {
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await securityNotifications.newLoginDetected({
				userId: "user-123",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "New Login Detected",
					body: expect.stringContaining("new login was detected"),
				}),
			);
		});
	});

	describe("emailChanged", () => {
		it("sends notification with new email address", async () => {
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await securityNotifications.emailChanged({
				userId: "user-123",
				newEmail: "newemail@example.com",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Email Address Changed",
					body: expect.stringContaining("newemail@example.com"),
				}),
			);
		});
	});
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { billingNotifications } from "./billing-notifications";

// Mock dependencies
const createNotificationMock = vi.hoisted(() => vi.fn());
const getUserByIdMock = vi.hoisted(() => vi.fn());
const shouldSendNotificationMock = vi.hoisted(() => vi.fn());
const dbMemberFindManyMock = vi.hoisted(() => vi.fn());
const sendEmailMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	createNotification: createNotificationMock,
	getUserById: getUserByIdMock,
	shouldSendNotification: shouldSendNotificationMock,
	db: {
		member: {
			findMany: dbMemberFindManyMock,
		},
	},
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

describe("billingNotifications", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("subscriptionCreated", () => {
		it("sends in-app notification to organization admins when preference allows", async () => {
			// Setup: organization has one admin
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
			]);
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp"; // Allow in-app, deny email
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await billingNotifications.subscriptionCreated({
				organizationId: "org-123",
				planName: "Pro",
			});

			// Verify admin lookup
			expect(dbMemberFindManyMock).toHaveBeenCalledWith({
				where: {
					organizationId: "org-123",
					role: { in: ["admin", "owner"] },
				},
				select: { userId: true },
			});

			// Verify in-app notification created
			expect(createNotificationMock).toHaveBeenCalledWith({
				userId: "admin-user-1",
				type: "success",
				category: "billing",
				title: "Subscription Activated",
				body: expect.stringContaining("Pro subscription is now active"),
				actionUrl: "https://app.example.com/app/settings/billing",
			});
		});

		it("sends email notification when preference allows", async () => {
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
			]);
			shouldSendNotificationMock.mockResolvedValue(true);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });
			getUserByIdMock.mockResolvedValue({
				id: "admin-user-1",
				email: "admin@example.com",
			});
			sendEmailMock.mockResolvedValue(true);

			await billingNotifications.subscriptionCreated({
				organizationId: "org-123",
				planName: "Pro",
			});

			// Verify email sent
			expect(sendEmailMock).toHaveBeenCalledWith({
				to: "admin@example.com",
				templateId: "notificationEmail",
				context: {
					title: "Subscription Activated",
					body: expect.stringContaining(
						"Pro subscription is now active",
					),
					actionUrl: "https://app.example.com/app/settings/billing",
					actionLabel: "View Billing",
				},
			});
		});

		it("does not send notifications when preferences are disabled", async () => {
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
			]);
			shouldSendNotificationMock.mockResolvedValue(false);

			await billingNotifications.subscriptionCreated({
				organizationId: "org-123",
				planName: "Pro",
			});

			expect(createNotificationMock).not.toHaveBeenCalled();
			expect(sendEmailMock).not.toHaveBeenCalled();
		});
	});

	describe("subscriptionRenewed", () => {
		it("sends renewal notification with correct content", async () => {
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
			]);
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await billingNotifications.subscriptionRenewed({
				organizationId: "org-123",
				planName: "Starter",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Subscription Renewed",
					body: expect.stringContaining(
						"Starter subscription has been renewed",
					),
				}),
			);
		});
	});

	describe("planUpgraded", () => {
		it("sends upgrade notification with old and new plan names", async () => {
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
			]);
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await billingNotifications.planUpgraded({
				organizationId: "org-123",
				oldPlanName: "Starter",
				newPlanName: "Pro",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "success",
					title: "Plan Upgraded",
					body: expect.stringContaining("from Starter to Pro"),
				}),
			);
		});
	});

	describe("planDowngraded", () => {
		it("sends downgrade notification with info type", async () => {
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
			]);
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await billingNotifications.planDowngraded({
				organizationId: "org-123",
				oldPlanName: "Pro",
				newPlanName: "Starter",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "info",
					title: "Plan Downgraded",
					body: expect.stringContaining("from Pro to Starter"),
				}),
			);
		});
	});

	describe("subscriptionCancelled", () => {
		it("sends cancellation notification with warning type", async () => {
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
			]);
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await billingNotifications.subscriptionCancelled({
				organizationId: "org-123",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "warning",
					title: "Subscription Cancelled",
					body: expect.stringContaining("has been cancelled"),
				}),
			);
		});
	});

	describe("creditPackPurchased", () => {
		it("sends credit pack notification with pack details", async () => {
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
			]);
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await billingNotifications.creditPackPurchased({
				organizationId: "org-123",
				packName: "Boost",
				credits: 50,
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "success",
					title: "Credit Pack Purchased",
					body: expect.stringContaining("Boost pack"),
				}),
			);
			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining("50 credits"),
				}),
			);
		});
	});

	describe("multiple admins", () => {
		it("sends notifications to all organization admins", async () => {
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
				{ userId: "admin-user-2" },
				{ userId: "owner-user-1" },
			]);
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await billingNotifications.subscriptionCreated({
				organizationId: "org-123",
				planName: "Pro",
			});

			// Should create notification for each admin
			expect(createNotificationMock).toHaveBeenCalledTimes(3);
			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({ userId: "admin-user-1" }),
			);
			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({ userId: "admin-user-2" }),
			);
			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({ userId: "owner-user-1" }),
			);
		});
	});
});

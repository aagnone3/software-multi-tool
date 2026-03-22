import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getUserById: vi.fn(),
	sendNotificationToUser: vi.fn(),
	sendNotificationToOrganizationMembers: vi.fn(),
	sendNotificationToOrganizationAdmins: vi.fn(),
}));

vi.mock("@repo/logs", () => ({
	logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@repo/mail", () => ({
	sendEmail: vi.fn(),
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: vi.fn(() => "https://app.example.com"),
}));

import {
	sendNotificationToOrganizationAdmins,
	sendNotificationToOrganizationMembers,
	sendNotificationToUser,
} from "@repo/database";
import {
	billingNotifications,
	notificationService,
	securityNotifications,
	systemNotifications,
	teamNotifications,
} from "./notification-service.js";

const mockSendToUser = vi.mocked(sendNotificationToUser);
const mockSendToOrgMembers = vi.mocked(sendNotificationToOrganizationMembers);
const mockSendToOrgAdmins = vi.mocked(sendNotificationToOrganizationAdmins);

beforeEach(() => {
	vi.clearAllMocks();
	mockSendToUser.mockResolvedValue(undefined);
	mockSendToOrgMembers.mockResolvedValue(undefined);
	mockSendToOrgAdmins.mockResolvedValue(undefined);
});

// =============================================================================
// notificationService
// =============================================================================

describe("notificationService", () => {
	describe("sendToUser", () => {
		it("delegates to sendNotificationToUser", async () => {
			await notificationService.sendToUser({
				userId: "u1",
				category: "billing",
				type: "info",
				title: "T",
				body: "B",
			});
			expect(mockSendToUser).toHaveBeenCalledWith(
				expect.objectContaining({ userId: "u1", title: "T" }),
				expect.any(Function),
			);
		});
	});

	describe("sendToOrganizationMembers", () => {
		it("delegates to sendNotificationToOrganizationMembers", async () => {
			await notificationService.sendToOrganizationMembers({
				organizationId: "org1",
				category: "team",
				type: "info",
				title: "Hello",
				body: "Body",
			});
			expect(mockSendToOrgMembers).toHaveBeenCalledWith(
				"org1",
				expect.objectContaining({ title: "Hello" }),
				expect.any(Function),
			);
		});
	});

	describe("sendToOrganizationAdmins", () => {
		it("delegates to sendNotificationToOrganizationAdmins", async () => {
			await notificationService.sendToOrganizationAdmins({
				organizationId: "org1",
				category: "billing",
				type: "success",
				title: "Activated",
				body: "Plan activated",
			});
			expect(mockSendToOrgAdmins).toHaveBeenCalledWith(
				"org1",
				expect.objectContaining({ title: "Activated" }),
				expect.any(Function),
			);
		});
	});
});

// =============================================================================
// billingNotifications
// =============================================================================

describe("billingNotifications", () => {
	it("subscriptionCreated sends to org admins with billing URL", async () => {
		await billingNotifications.subscriptionCreated({
			organizationId: "org1",
			planName: "Pro",
		});
		expect(mockSendToOrgAdmins).toHaveBeenCalledWith(
			"org1",
			expect.objectContaining({
				title: "Subscription Activated",
				category: "billing",
				type: "success",
			}),
			expect.any(Function),
		);
	});

	it("subscriptionRenewed sends success notification", async () => {
		await billingNotifications.subscriptionRenewed({
			organizationId: "org1",
			planName: "Basic",
		});
		expect(mockSendToOrgAdmins).toHaveBeenCalledWith(
			"org1",
			expect.objectContaining({
				title: "Subscription Renewed",
				type: "success",
			}),
			expect.any(Function),
		);
	});

	it("planUpgraded mentions both old and new plan names", async () => {
		await billingNotifications.planUpgraded({
			organizationId: "org1",
			oldPlanName: "Basic",
			newPlanName: "Pro",
		});
		const [, params] = mockSendToOrgAdmins.mock.calls.at(0);
		expect((params as { body: string }).body).toContain("Basic");
		expect((params as { body: string }).body).toContain("Pro");
	});

	it("planDowngraded sends info notification", async () => {
		await billingNotifications.planDowngraded({
			organizationId: "org1",
			oldPlanName: "Pro",
			newPlanName: "Basic",
		});
		expect(mockSendToOrgAdmins).toHaveBeenCalledWith(
			"org1",
			expect.objectContaining({ title: "Plan Downgraded", type: "info" }),
			expect.any(Function),
		);
	});

	it("subscriptionCancelled sends warning notification", async () => {
		await billingNotifications.subscriptionCancelled({
			organizationId: "org1",
		});
		expect(mockSendToOrgAdmins).toHaveBeenCalledWith(
			"org1",
			expect.objectContaining({
				title: "Subscription Cancelled",
				type: "warning",
			}),
			expect.any(Function),
		);
	});

	it("creditPackPurchased mentions credits count in body", async () => {
		await billingNotifications.creditPackPurchased({
			organizationId: "org1",
			packName: "Starter",
			credits: 500,
		});
		const [, params] = mockSendToOrgAdmins.mock.calls.at(0);
		expect((params as { body: string }).body).toContain("500");
	});
});

// =============================================================================
// securityNotifications
// =============================================================================

describe("securityNotifications", () => {
	it("passwordChanged sends to user with security category", async () => {
		await securityNotifications.passwordChanged({ userId: "u1" });
		expect(mockSendToUser).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "u1",
				category: "security",
				title: "Password Changed",
			}),
			expect.any(Function),
		);
	});

	it("twoFactorEnabled sends success notification", async () => {
		await securityNotifications.twoFactorEnabled({ userId: "u1" });
		expect(mockSendToUser).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "success",
				title: "Two-Factor Authentication Enabled",
			}),
			expect.any(Function),
		);
	});

	it("twoFactorDisabled sends warning notification", async () => {
		await securityNotifications.twoFactorDisabled({ userId: "u1" });
		expect(mockSendToUser).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "warning",
				title: "Two-Factor Authentication Disabled",
			}),
			expect.any(Function),
		);
	});

	it("newLoginDetected without details uses generic message", async () => {
		await securityNotifications.newLoginDetected({ userId: "u1" });
		const [params] = mockSendToUser.mock.calls.at(0);
		expect((params as { body: string }).body).toContain(
			"new login was detected",
		);
	});

	it("newLoginDetected with device and location includes details in body", async () => {
		await securityNotifications.newLoginDetected({
			userId: "u1",
			deviceInfo: "Chrome on Mac",
			location: "New York",
		});
		const [params] = mockSendToUser.mock.calls.at(0);
		expect((params as { body: string }).body).toContain("Chrome on Mac");
		expect((params as { body: string }).body).toContain("New York");
	});
});

// =============================================================================
// teamNotifications
// =============================================================================

describe("teamNotifications", () => {
	it("memberJoined sends to org admins with member display name", async () => {
		await teamNotifications.memberJoined({
			organizationId: "org1",
			memberName: "Alice",
			memberEmail: "alice@example.com",
		});
		const [, params] = mockSendToOrgAdmins.mock.calls.at(0);
		expect((params as { body: string }).body).toContain("Alice");
	});

	it("memberJoined falls back to email when name is empty", async () => {
		await teamNotifications.memberJoined({
			organizationId: "org1",
			memberName: "",
			memberEmail: "alice@example.com",
		});
		const [, params] = mockSendToOrgAdmins.mock.calls.at(0);
		expect((params as { body: string }).body).toContain(
			"alice@example.com",
		);
	});

	it("memberLeft sends info notification", async () => {
		await teamNotifications.memberLeft({
			organizationId: "org1",
			memberName: "Bob",
			memberEmail: "bob@example.com",
		});
		expect(mockSendToOrgAdmins).toHaveBeenCalledWith(
			"org1",
			expect.objectContaining({ title: "Team Member Left" }),
			expect.any(Function),
		);
	});

	it("roleChanged sends to user with new role in body", async () => {
		await teamNotifications.roleChanged({
			userId: "u1",
			organizationName: "Acme",
			newRole: "admin",
		});
		const [params] = mockSendToUser.mock.calls.at(0);
		expect((params as { body: string }).body).toContain("admin");
	});

	it("invitationReceived sends to user with org name in body", async () => {
		await teamNotifications.invitationReceived({
			userId: "u1",
			organizationName: "Acme",
		});
		const [params] = mockSendToUser.mock.calls.at(0);
		expect((params as { body: string }).body).toContain("Acme");
	});
});

// =============================================================================
// systemNotifications
// =============================================================================

describe("systemNotifications", () => {
	it("scheduledMaintenance includes date in body", async () => {
		await systemNotifications.scheduledMaintenance({
			userId: "u1",
			maintenanceDate: "2026-04-01 02:00 UTC",
		});
		const [params] = mockSendToUser.mock.calls.at(0);
		expect((params as { body: string }).body).toContain(
			"2026-04-01 02:00 UTC",
		);
	});

	it("scheduledMaintenance includes duration when provided", async () => {
		await systemNotifications.scheduledMaintenance({
			userId: "u1",
			maintenanceDate: "2026-04-01 02:00 UTC",
			duration: "2 hours",
		});
		const [params] = mockSendToUser.mock.calls.at(0);
		expect((params as { body: string }).body).toContain("2 hours");
	});

	it("newFeatureAnnouncement passes learnMoreUrl as actionUrl", async () => {
		await systemNotifications.newFeatureAnnouncement({
			userId: "u1",
			featureName: "AI Insights",
			description: "New AI-powered insights.",
			learnMoreUrl: "https://app.example.com/features",
		});
		expect(mockSendToUser).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "New Feature: AI Insights",
				actionUrl: "https://app.example.com/features",
			}),
			expect.any(Function),
		);
	});
});

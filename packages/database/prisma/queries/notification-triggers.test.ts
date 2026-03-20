import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SendNotificationInput } from "./notification-triggers";
import {
	sendNotificationToOrganizationAdmins,
	sendNotificationToOrganizationMembers,
	sendNotificationToUser,
} from "./notification-triggers";

// Mock dependencies
vi.mock("../client", () => ({
	db: {
		member: {
			findMany: vi.fn(),
		},
	},
}));

vi.mock("./notification-preferences", () => ({
	shouldSendNotification: vi.fn(),
}));

vi.mock("./notifications", () => ({
	createNotification: vi.fn(),
}));

vi.mock("@repo/logs", () => ({
	logger: {
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

import { db } from "../client";
import { shouldSendNotification } from "./notification-preferences";
import { createNotification } from "./notifications";

const mockDb = db as unknown as {
	member: { findMany: ReturnType<typeof vi.fn> };
};
const mockShouldSendNotification = shouldSendNotification as ReturnType<
	typeof vi.fn
>;
const mockCreateNotification = createNotification as ReturnType<typeof vi.fn>;

const baseInput: SendNotificationInput = {
	userId: "user-1",
	category: "billing",
	type: "info",
	title: "Test Title",
	body: "Test body",
};

describe("sendNotificationToUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("sends in-app notification when preference allows", async () => {
		mockShouldSendNotification.mockResolvedValueOnce(true); // inApp
		mockShouldSendNotification.mockResolvedValueOnce(false); // email
		mockCreateNotification.mockResolvedValueOnce({ id: "notif-1" });

		const result = await sendNotificationToUser(baseInput);

		expect(result.inAppSent).toBe(true);
		expect(result.notificationId).toBe("notif-1");
		expect(result.emailSent).toBe(false);
	});

	it("sends email notification when preference allows and sendEmailFn provided", async () => {
		mockShouldSendNotification.mockResolvedValueOnce(false); // inApp
		mockShouldSendNotification.mockResolvedValueOnce(true); // email
		const sendEmailFn = vi.fn().mockResolvedValueOnce(true);

		const result = await sendNotificationToUser(baseInput, sendEmailFn);

		expect(result.inAppSent).toBe(false);
		expect(result.emailSent).toBe(true);
		expect(sendEmailFn).toHaveBeenCalledWith(
			"user-1",
			"billing",
			"Test Title",
			"Test body",
			undefined,
		);
	});

	it("does not send email when sendEmailFn not provided", async () => {
		mockShouldSendNotification.mockResolvedValueOnce(false); // inApp
		mockShouldSendNotification.mockResolvedValueOnce(true); // email

		const result = await sendNotificationToUser(baseInput);

		expect(result.emailSent).toBe(false);
	});

	it("skips in-app when preference disallows", async () => {
		mockShouldSendNotification.mockResolvedValueOnce(false); // inApp
		mockShouldSendNotification.mockResolvedValueOnce(false); // email

		const result = await sendNotificationToUser(baseInput);

		expect(result.inAppSent).toBe(false);
		expect(mockCreateNotification).not.toHaveBeenCalled();
	});

	it("handles createNotification error gracefully", async () => {
		mockShouldSendNotification.mockResolvedValueOnce(true); // inApp
		mockShouldSendNotification.mockResolvedValueOnce(false); // email
		mockCreateNotification.mockRejectedValueOnce(new Error("DB error"));

		const result = await sendNotificationToUser(baseInput);

		expect(result.inAppSent).toBe(false);
	});

	it("includes actionUrl in notification when provided", async () => {
		mockShouldSendNotification.mockResolvedValueOnce(true); // inApp
		mockShouldSendNotification.mockResolvedValueOnce(false); // email
		mockCreateNotification.mockResolvedValueOnce({ id: "notif-2" });

		await sendNotificationToUser({ ...baseInput, actionUrl: "/billing" });

		expect(mockCreateNotification).toHaveBeenCalledWith(
			expect.objectContaining({ actionUrl: "/billing" }),
		);
	});
});

describe("sendNotificationToOrganizationMembers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("sends to all members of the organization", async () => {
		mockDb.member.findMany.mockResolvedValueOnce([
			{ userId: "user-a" },
			{ userId: "user-b" },
		]);
		// Both users: inApp=true, email=false
		mockShouldSendNotification
			.mockResolvedValueOnce(true)
			.mockResolvedValueOnce(false)
			.mockResolvedValueOnce(true)
			.mockResolvedValueOnce(false);
		mockCreateNotification
			.mockResolvedValueOnce({ id: "n1" })
			.mockResolvedValueOnce({ id: "n2" });

		const results = await sendNotificationToOrganizationMembers("org-1", {
			category: "team",
			type: "success",
			title: "Hi",
			body: "Hello",
		});

		expect(results).toHaveLength(2);
		expect(results[0].userId).toBe("user-a");
		expect(results[1].userId).toBe("user-b");
	});

	it("returns empty array when org has no members", async () => {
		mockDb.member.findMany.mockResolvedValueOnce([]);

		const results = await sendNotificationToOrganizationMembers(
			"org-empty",
			{
				category: "system",
				type: "info",
				title: "T",
				body: "B",
			},
		);

		expect(results).toHaveLength(0);
	});
});

describe("sendNotificationToOrganizationAdmins", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("sends only to admins and owners", async () => {
		mockDb.member.findMany.mockResolvedValueOnce([
			{ userId: "admin-1" },
			{ userId: "owner-1" },
		]);
		mockShouldSendNotification.mockResolvedValue(false);

		const results = await sendNotificationToOrganizationAdmins("org-1", {
			category: "billing",
			type: "warning",
			title: "Invoice",
			body: "Your invoice is ready",
		});

		expect(results).toHaveLength(2);
		// Verify the query filtered by admin/owner roles
		expect(mockDb.member.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					role: { in: ["admin", "owner"] },
				}),
			}),
		);
	});

	it("returns empty array when no admins in org", async () => {
		mockDb.member.findMany.mockResolvedValueOnce([]);

		const results = await sendNotificationToOrganizationAdmins(
			"org-empty",
			{
				category: "security",
				type: "error",
				title: "Alert",
				body: "Security alert",
			},
		);

		expect(results).toHaveLength(0);
	});
});

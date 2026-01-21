import { beforeEach, describe, expect, it, vi } from "vitest";
import { teamNotifications } from "./team-notifications";

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

describe("teamNotifications", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("memberJoined", () => {
		it("sends notification to organization admins when member joins", async () => {
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
			]);
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await teamNotifications.memberJoined({
				organizationId: "org-123",
				organizationName: "Acme Inc",
				memberName: "John Doe",
				memberEmail: "john@example.com",
			});

			expect(dbMemberFindManyMock).toHaveBeenCalledWith({
				where: {
					organizationId: "org-123",
					role: { in: ["admin", "owner"] },
				},
				select: { userId: true },
			});

			expect(createNotificationMock).toHaveBeenCalledWith({
				userId: "admin-user-1",
				type: "info",
				category: "team",
				title: "New Team Member",
				body: expect.stringContaining("John Doe has joined Acme Inc"),
				actionUrl: "https://app.example.com/app/settings/team",
			});
		});

		it("uses email when member name is not provided", async () => {
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
			]);
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await teamNotifications.memberJoined({
				organizationId: "org-123",
				organizationName: "Acme Inc",
				memberName: "",
				memberEmail: "john@example.com",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining(
						"john@example.com has joined",
					),
				}),
			);
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

			await teamNotifications.memberJoined({
				organizationId: "org-123",
				organizationName: "Acme Inc",
				memberName: "John Doe",
				memberEmail: "john@example.com",
			});

			expect(sendEmailMock).toHaveBeenCalledWith({
				to: "admin@example.com",
				templateId: "notificationEmail",
				context: {
					title: "New Team Member",
					body: expect.stringContaining("John Doe has joined"),
					actionUrl: "https://app.example.com/app/settings/team",
					actionLabel: "View Team",
				},
			});
		});
	});

	describe("memberLeft", () => {
		it("sends notification to admins when member leaves", async () => {
			dbMemberFindManyMock.mockResolvedValue([
				{ userId: "admin-user-1" },
			]);
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await teamNotifications.memberLeft({
				organizationId: "org-123",
				organizationName: "Acme Inc",
				memberName: "Jane Doe",
				memberEmail: "jane@example.com",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Team Member Left",
					body: expect.stringContaining("Jane Doe has left Acme Inc"),
				}),
			);
		});
	});

	describe("roleChanged", () => {
		it("sends notification to the user whose role changed", async () => {
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await teamNotifications.roleChanged({
				userId: "user-123",
				organizationName: "Acme Inc",
				newRole: "admin",
			});

			expect(createNotificationMock).toHaveBeenCalledWith({
				userId: "user-123",
				type: "info",
				category: "team",
				title: "Role Changed",
				body: expect.stringContaining("Admin"),
				actionUrl: "https://app.example.com/app/settings/team",
			});
		});

		it("formats role name with capitalization", async () => {
			shouldSendNotificationMock.mockImplementation(
				async (_userId: string, _category: string, channel: string) => {
					return channel === "inApp";
				},
			);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });

			await teamNotifications.roleChanged({
				userId: "user-123",
				organizationName: "Acme Inc",
				newRole: "member",
			});

			expect(createNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining("Member"),
				}),
			);
		});

		it("sends email notification when preference allows", async () => {
			shouldSendNotificationMock.mockResolvedValue(true);
			createNotificationMock.mockResolvedValue({ id: "notif-1" });
			getUserByIdMock.mockResolvedValue({
				id: "user-123",
				email: "user@example.com",
			});
			sendEmailMock.mockResolvedValue(true);

			await teamNotifications.roleChanged({
				userId: "user-123",
				organizationName: "Acme Inc",
				newRole: "owner",
			});

			expect(sendEmailMock).toHaveBeenCalledWith({
				to: "user@example.com",
				templateId: "notificationEmail",
				context: {
					title: "Role Changed",
					body: expect.stringContaining("Owner"),
					actionUrl: "https://app.example.com/app/settings/team",
					actionLabel: "View Team",
				},
			});
		});

		it("does not send notifications when preferences are disabled", async () => {
			shouldSendNotificationMock.mockResolvedValue(false);

			await teamNotifications.roleChanged({
				userId: "user-123",
				organizationName: "Acme Inc",
				newRole: "admin",
			});

			expect(createNotificationMock).not.toHaveBeenCalled();
			expect(sendEmailMock).not.toHaveBeenCalled();
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

			await teamNotifications.memberJoined({
				organizationId: "org-123",
				organizationName: "Acme Inc",
				memberName: "John Doe",
				memberEmail: "john@example.com",
			});

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

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the database client
vi.mock("../client", () => ({
	db: {
		notificationPreference: {
			findUnique: vi.fn(),
			create: vi.fn(),
			upsert: vi.fn(),
			deleteMany: vi.fn(),
		},
	},
}));

import { db } from "../client";
import {
	DEFAULT_PREFERENCES,
	deleteNotificationPreferences,
	getNotificationPreferences,
	shouldSendNotification,
	updateNotificationPreferences,
} from "./notification-preferences";

describe("Notification Preferences Queries", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getNotificationPreferences", () => {
		it("should return existing preferences for user", async () => {
			const mockPreferences = {
				id: "pref_123",
				userId: "user_123",
				billing: { inApp: true, email: false },
				security: { inApp: true, email: true },
				team: { inApp: false, email: true },
				system: { inApp: true, email: false },
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(
				mockPreferences,
			);

			const result = await getNotificationPreferences("user_123");

			expect(db.notificationPreference.findUnique).toHaveBeenCalledWith({
				where: { userId: "user_123" },
			});
			expect(result).toEqual({
				billing: { inApp: true, email: false },
				security: { inApp: true, email: true },
				team: { inApp: false, email: true },
				system: { inApp: true, email: false },
			});
		});

		it("should create default preferences for new user", async () => {
			const mockCreatedPreferences = {
				id: "pref_new",
				userId: "user_new",
				billing: DEFAULT_PREFERENCES.billing,
				security: DEFAULT_PREFERENCES.security,
				team: DEFAULT_PREFERENCES.team,
				system: DEFAULT_PREFERENCES.system,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(
				null,
			);
			vi.mocked(db.notificationPreference.create).mockResolvedValue(
				mockCreatedPreferences,
			);

			const result = await getNotificationPreferences("user_new");

			expect(db.notificationPreference.findUnique).toHaveBeenCalledWith({
				where: { userId: "user_new" },
			});
			expect(db.notificationPreference.create).toHaveBeenCalledWith({
				data: {
					userId: "user_new",
					billing: DEFAULT_PREFERENCES.billing,
					security: DEFAULT_PREFERENCES.security,
					team: DEFAULT_PREFERENCES.team,
					system: DEFAULT_PREFERENCES.system,
				},
			});
			expect(result).toEqual(DEFAULT_PREFERENCES);
		});
	});

	describe("updateNotificationPreferences", () => {
		it("should update specific category preferences", async () => {
			const mockUpdatedPreferences = {
				id: "pref_123",
				userId: "user_123",
				billing: { inApp: false, email: true },
				security: DEFAULT_PREFERENCES.security,
				team: DEFAULT_PREFERENCES.team,
				system: DEFAULT_PREFERENCES.system,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(db.notificationPreference.upsert).mockResolvedValue(
				mockUpdatedPreferences,
			);

			const result = await updateNotificationPreferences("user_123", {
				billing: { inApp: false, email: true },
			});

			expect(db.notificationPreference.upsert).toHaveBeenCalledWith({
				where: { userId: "user_123" },
				update: { billing: { inApp: false, email: true } },
				create: {
					userId: "user_123",
					billing: { inApp: false, email: true },
					security: DEFAULT_PREFERENCES.security,
					team: DEFAULT_PREFERENCES.team,
					system: DEFAULT_PREFERENCES.system,
				},
			});
			expect(result.billing).toEqual({ inApp: false, email: true });
		});

		it("should update multiple categories at once", async () => {
			const mockUpdatedPreferences = {
				id: "pref_123",
				userId: "user_123",
				billing: { inApp: false, email: false },
				security: { inApp: true, email: false },
				team: DEFAULT_PREFERENCES.team,
				system: DEFAULT_PREFERENCES.system,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(db.notificationPreference.upsert).mockResolvedValue(
				mockUpdatedPreferences,
			);

			const result = await updateNotificationPreferences("user_123", {
				billing: { inApp: false, email: false },
				security: { inApp: true, email: false },
			});

			expect(db.notificationPreference.upsert).toHaveBeenCalledWith({
				where: { userId: "user_123" },
				update: {
					billing: { inApp: false, email: false },
					security: { inApp: true, email: false },
				},
				create: {
					userId: "user_123",
					billing: { inApp: false, email: false },
					security: { inApp: true, email: false },
					team: DEFAULT_PREFERENCES.team,
					system: DEFAULT_PREFERENCES.system,
				},
			});
			expect(result.billing).toEqual({ inApp: false, email: false });
			expect(result.security).toEqual({ inApp: true, email: false });
		});

		it("should create preferences if user has none", async () => {
			const mockCreatedPreferences = {
				id: "pref_new",
				userId: "user_new",
				billing: { inApp: false, email: true },
				security: DEFAULT_PREFERENCES.security,
				team: DEFAULT_PREFERENCES.team,
				system: DEFAULT_PREFERENCES.system,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(db.notificationPreference.upsert).mockResolvedValue(
				mockCreatedPreferences,
			);

			const result = await updateNotificationPreferences("user_new", {
				billing: { inApp: false, email: true },
			});

			expect(result.billing).toEqual({ inApp: false, email: true });
		});
	});

	describe("shouldSendNotification", () => {
		it("should return true when notification is enabled", async () => {
			const mockPreferences = {
				id: "pref_123",
				userId: "user_123",
				billing: { inApp: true, email: true },
				security: { inApp: true, email: true },
				team: { inApp: true, email: true },
				system: { inApp: true, email: false },
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(
				mockPreferences,
			);

			const result = await shouldSendNotification(
				"user_123",
				"billing",
				"email",
			);

			expect(result).toBe(true);
		});

		it("should return false when notification is disabled", async () => {
			const mockPreferences = {
				id: "pref_123",
				userId: "user_123",
				billing: { inApp: true, email: true },
				security: { inApp: true, email: true },
				team: { inApp: true, email: true },
				system: { inApp: true, email: false },
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(
				mockPreferences,
			);

			const result = await shouldSendNotification(
				"user_123",
				"system",
				"email",
			);

			expect(result).toBe(false);
		});

		it("should use defaults when no preferences exist", async () => {
			const mockCreatedPreferences = {
				id: "pref_new",
				userId: "user_new",
				billing: DEFAULT_PREFERENCES.billing,
				security: DEFAULT_PREFERENCES.security,
				team: DEFAULT_PREFERENCES.team,
				system: DEFAULT_PREFERENCES.system,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(
				null,
			);
			vi.mocked(db.notificationPreference.create).mockResolvedValue(
				mockCreatedPreferences,
			);

			// System email defaults to false
			const systemEmailResult = await shouldSendNotification(
				"user_new",
				"system",
				"email",
			);
			expect(systemEmailResult).toBe(false);
		});
	});

	describe("deleteNotificationPreferences", () => {
		it("should delete preferences for user", async () => {
			vi.mocked(db.notificationPreference.deleteMany).mockResolvedValue({
				count: 1,
			});

			await deleteNotificationPreferences("user_123");

			expect(db.notificationPreference.deleteMany).toHaveBeenCalledWith({
				where: { userId: "user_123" },
			});
		});

		it("should not throw when no preferences exist", async () => {
			vi.mocked(db.notificationPreference.deleteMany).mockResolvedValue({
				count: 0,
			});

			await expect(
				deleteNotificationPreferences("user_nonexistent"),
			).resolves.not.toThrow();
		});
	});

	describe("DEFAULT_PREFERENCES", () => {
		it("should have correct default values", () => {
			expect(DEFAULT_PREFERENCES).toEqual({
				billing: { inApp: true, email: true },
				security: { inApp: true, email: true },
				team: { inApp: true, email: true },
				system: { inApp: true, email: false },
			});
		});
	});
});

import type { Prisma } from "@prisma/client";
import { db } from "../client";

/**
 * Shape of channel preferences for a notification category.
 */
export interface ChannelPreferences {
	inApp: boolean;
	email: boolean;
}

/**
 * All notification preference categories and their channel settings.
 */
export interface NotificationPreferencesData {
	billing: ChannelPreferences;
	security: ChannelPreferences;
	team: ChannelPreferences;
	system: ChannelPreferences;
}

/**
 * Default preferences for new users.
 */
export const DEFAULT_PREFERENCES: NotificationPreferencesData = {
	billing: { inApp: true, email: true },
	security: { inApp: true, email: true },
	team: { inApp: true, email: true },
	system: { inApp: true, email: false },
};

/**
 * Helper to convert ChannelPreferences to Prisma InputJsonValue.
 */
function toJsonValue(prefs: ChannelPreferences): Prisma.InputJsonValue {
	return { inApp: prefs.inApp, email: prefs.email };
}

/**
 * Helper to safely parse JSON field to ChannelPreferences.
 */
function parseChannelPreferences(value: Prisma.JsonValue): ChannelPreferences {
	const obj = value as { inApp?: boolean; email?: boolean };
	return {
		inApp: obj.inApp ?? true,
		email: obj.email ?? true,
	};
}

/**
 * Get notification preferences for a user.
 * Creates default preferences if none exist (lazy initialization).
 */
export async function getNotificationPreferences(
	userId: string,
): Promise<NotificationPreferencesData> {
	const preferences = await db.notificationPreference.findUnique({
		where: { userId },
	});

	if (!preferences) {
		// Create default preferences for first-time access
		const created = await db.notificationPreference.create({
			data: {
				userId,
				billing: toJsonValue(DEFAULT_PREFERENCES.billing),
				security: toJsonValue(DEFAULT_PREFERENCES.security),
				team: toJsonValue(DEFAULT_PREFERENCES.team),
				system: toJsonValue(DEFAULT_PREFERENCES.system),
			},
		});

		return {
			billing: parseChannelPreferences(created.billing),
			security: parseChannelPreferences(created.security),
			team: parseChannelPreferences(created.team),
			system: parseChannelPreferences(created.system),
		};
	}

	return {
		billing: parseChannelPreferences(preferences.billing),
		security: parseChannelPreferences(preferences.security),
		team: parseChannelPreferences(preferences.team),
		system: parseChannelPreferences(preferences.system),
	};
}

/**
 * Update notification preferences for a user.
 * Creates preferences if they don't exist yet.
 */
export async function updateNotificationPreferences(
	userId: string,
	updates: Partial<NotificationPreferencesData>,
): Promise<NotificationPreferencesData> {
	const data: Prisma.NotificationPreferenceUpdateInput = {};

	if (updates.billing) {
		data.billing = toJsonValue(updates.billing);
	}
	if (updates.security) {
		data.security = toJsonValue(updates.security);
	}
	if (updates.team) {
		data.team = toJsonValue(updates.team);
	}
	if (updates.system) {
		data.system = toJsonValue(updates.system);
	}

	const preferences = await db.notificationPreference.upsert({
		where: { userId },
		update: data,
		create: {
			userId,
			billing: toJsonValue(
				updates.billing ?? DEFAULT_PREFERENCES.billing,
			),
			security: toJsonValue(
				updates.security ?? DEFAULT_PREFERENCES.security,
			),
			team: toJsonValue(updates.team ?? DEFAULT_PREFERENCES.team),
			system: toJsonValue(updates.system ?? DEFAULT_PREFERENCES.system),
		},
	});

	return {
		billing: parseChannelPreferences(preferences.billing),
		security: parseChannelPreferences(preferences.security),
		team: parseChannelPreferences(preferences.team),
		system: parseChannelPreferences(preferences.system),
	};
}

/**
 * Check if a user should receive a notification for a specific category and channel.
 * Returns true if no preferences exist (defaults to enabled for most categories).
 */
export async function shouldSendNotification(
	userId: string,
	category: keyof NotificationPreferencesData,
	channel: keyof ChannelPreferences,
): Promise<boolean> {
	const preferences = await getNotificationPreferences(userId);
	return preferences[category][channel];
}

/**
 * Delete notification preferences for a user (used during account deletion).
 */
export async function deleteNotificationPreferences(
	userId: string,
): Promise<void> {
	await db.notificationPreference.deleteMany({
		where: { userId },
	});
}

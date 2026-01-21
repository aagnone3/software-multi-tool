import { db } from "../client";
import { shouldSendNotification } from "./notification-preferences";
import { createNotification } from "./notifications";

/**
 * Notification categories matching the preferences model.
 */
export type NotificationCategory = "billing" | "security" | "team" | "system";

/**
 * Notification types for styling/importance.
 */
export type NotificationType = "info" | "success" | "warning" | "error";

/**
 * Input for sending a notification.
 */
export interface SendNotificationInput {
	userId: string;
	category: NotificationCategory;
	type: NotificationType;
	title: string;
	body: string;
	actionUrl?: string;
}

/**
 * Result of a notification send attempt.
 */
export interface SendNotificationResult {
	inAppSent: boolean;
	emailSent: boolean;
	notificationId?: string;
}

/**
 * Send a notification to a user, respecting their preferences.
 * Creates an in-app notification and optionally sends an email based on user preferences.
 *
 * @param input - The notification details
 * @param sendEmailFn - Optional custom email sending function (for dependency injection in tests)
 * @returns Result indicating which channels were used
 */
export async function sendNotificationToUser(
	input: SendNotificationInput,
	sendEmailFn?: (
		userId: string,
		category: NotificationCategory,
		title: string,
		body: string,
		actionUrl?: string,
	) => Promise<boolean>,
): Promise<SendNotificationResult> {
	const { userId, category, type, title, body, actionUrl } = input;

	const result: SendNotificationResult = {
		inAppSent: false,
		emailSent: false,
	};

	// Check in-app preference
	const shouldSendInApp = await shouldSendNotification(
		userId,
		category,
		"inApp",
	);

	if (shouldSendInApp) {
		try {
			const notification = await createNotification({
				userId,
				type,
				category,
				title,
				body,
				actionUrl,
			});
			result.inAppSent = true;
			result.notificationId = notification.id;
		} catch {
			// Error handling delegated to caller
		}
	}

	// Check email preference
	const shouldSendEmail = await shouldSendNotification(
		userId,
		category,
		"email",
	);

	if (shouldSendEmail && sendEmailFn) {
		try {
			const emailSent = await sendEmailFn(
				userId,
				category,
				title,
				body,
				actionUrl,
			);
			result.emailSent = emailSent;
		} catch {
			// Error handling delegated to caller
		}
	}

	return result;
}

/**
 * Send a notification to all members of an organization.
 * Useful for billing and team notifications.
 *
 * @param organizationId - The organization ID
 * @param input - The notification details (without userId)
 * @param sendEmailFn - Optional custom email sending function
 * @returns Array of results for each member
 */
export async function sendNotificationToOrganizationMembers(
	organizationId: string,
	input: Omit<SendNotificationInput, "userId">,
	sendEmailFn?: (
		userId: string,
		category: NotificationCategory,
		title: string,
		body: string,
		actionUrl?: string,
	) => Promise<boolean>,
): Promise<Array<{ userId: string; result: SendNotificationResult }>> {
	// Get all members of the organization
	const members = await db.member.findMany({
		where: { organizationId },
		select: { userId: true },
	});

	const results: Array<{ userId: string; result: SendNotificationResult }> =
		[];

	for (const member of members) {
		const result = await sendNotificationToUser(
			{ ...input, userId: member.userId },
			sendEmailFn,
		);
		results.push({ userId: member.userId, result });
	}

	return results;
}

/**
 * Send a notification to organization admins/owners only.
 * Useful for billing notifications that should only go to decision makers.
 *
 * @param organizationId - The organization ID
 * @param input - The notification details (without userId)
 * @param sendEmailFn - Optional custom email sending function
 * @returns Array of results for each admin
 */
export async function sendNotificationToOrganizationAdmins(
	organizationId: string,
	input: Omit<SendNotificationInput, "userId">,
	sendEmailFn?: (
		userId: string,
		category: NotificationCategory,
		title: string,
		body: string,
		actionUrl?: string,
	) => Promise<boolean>,
): Promise<Array<{ userId: string; result: SendNotificationResult }>> {
	// Get admins and owners of the organization
	const admins = await db.member.findMany({
		where: {
			organizationId,
			role: { in: ["admin", "owner"] },
		},
		select: { userId: true },
	});

	const results: Array<{ userId: string; result: SendNotificationResult }> =
		[];

	for (const admin of admins) {
		const result = await sendNotificationToUser(
			{ ...input, userId: admin.userId },
			sendEmailFn,
		);
		results.push({ userId: admin.userId, result });
	}

	return results;
}

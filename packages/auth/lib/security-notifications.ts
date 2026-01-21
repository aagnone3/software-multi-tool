import {
	createNotification,
	getUserById,
	shouldSendNotification,
} from "@repo/database";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { getBaseUrl } from "@repo/utils";

/**
 * Send notification email for security events.
 */
async function sendSecurityNotificationEmail(
	userId: string,
	title: string,
	body: string,
	actionUrl?: string,
): Promise<boolean> {
	try {
		const user = await getUserById(userId);
		if (!user?.email) {
			logger.warn(
				`Cannot send security notification email: user ${userId} has no email`,
			);
			return false;
		}

		return await sendEmail({
			to: user.email,
			templateId: "notificationEmail",
			context: {
				title,
				body,
				actionUrl,
				actionLabel: actionUrl ? "Security Settings" : undefined,
			},
		});
	} catch (error) {
		logger.error(
			`Failed to send security notification email to user ${userId}:`,
			error,
		);
		return false;
	}
}

/**
 * Send a security notification to a user.
 * Respects user notification preferences for both in-app and email.
 */
async function notifyUser(
	userId: string,
	title: string,
	body: string,
	type: "info" | "success" | "warning" | "error" = "info",
	actionUrl?: string,
): Promise<void> {
	// Check in-app preference
	const shouldSendInApp = await shouldSendNotification(
		userId,
		"security",
		"inApp",
	);
	if (shouldSendInApp) {
		try {
			await createNotification({
				userId,
				type,
				category: "security",
				title,
				body,
				actionUrl,
			});
			logger.info(
				`Created security notification for user ${userId}: ${title}`,
			);
		} catch (error) {
			logger.error(
				`Failed to create security notification for user ${userId}:`,
				error,
			);
		}
	}

	// Check email preference
	const shouldSendEmail = await shouldSendNotification(
		userId,
		"security",
		"email",
	);
	if (shouldSendEmail) {
		await sendSecurityNotificationEmail(userId, title, body, actionUrl);
	}
}

/**
 * Security notification triggers for Better Auth events.
 */
export const securityNotifications = {
	/**
	 * Notify when password is changed.
	 */
	async passwordChanged(params: { userId: string }): Promise<void> {
		const { userId } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/account`;

		await notifyUser(
			userId,
			"Password Changed",
			"Your password has been changed successfully. If you did not make this change, please contact support immediately.",
			"info",
			actionUrl,
		);
	},

	/**
	 * Notify when 2FA is enabled.
	 */
	async twoFactorEnabled(params: { userId: string }): Promise<void> {
		const { userId } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/account`;

		await notifyUser(
			userId,
			"Two-Factor Authentication Enabled",
			"Two-factor authentication has been enabled for your account. Your account is now more secure.",
			"success",
			actionUrl,
		);
	},

	/**
	 * Notify when 2FA is disabled.
	 */
	async twoFactorDisabled(params: { userId: string }): Promise<void> {
		const { userId } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/account`;

		await notifyUser(
			userId,
			"Two-Factor Authentication Disabled",
			"Two-factor authentication has been disabled for your account. We recommend keeping 2FA enabled for better security.",
			"warning",
			actionUrl,
		);
	},

	/**
	 * Notify when a new session is created from a new location/device.
	 */
	async newLoginDetected(params: {
		userId: string;
		deviceInfo?: string;
		location?: string;
	}): Promise<void> {
		const { userId, deviceInfo, location } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/account`;

		let body = "A new login was detected on your account.";
		if (deviceInfo || location) {
			const details = [deviceInfo, location]
				.filter(Boolean)
				.join(" from ");
			body = `A new login was detected on your account${details ? `: ${details}` : ""}.`;
		}
		body += " If this wasn't you, please secure your account immediately.";

		await notifyUser(userId, "New Login Detected", body, "info", actionUrl);
	},

	/**
	 * Notify when email is changed.
	 */
	async emailChanged(params: {
		userId: string;
		newEmail: string;
	}): Promise<void> {
		const { userId, newEmail } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/account`;

		await notifyUser(
			userId,
			"Email Address Changed",
			`Your email address has been changed to ${newEmail}. If you did not make this change, please contact support immediately.`,
			"info",
			actionUrl,
		);
	},
};

import {
	getUserById,
	type NotificationCategory,
	type NotificationType,
	sendNotificationToOrganizationAdmins,
	sendNotificationToOrganizationMembers,
	sendNotificationToUser,
} from "@repo/database";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { getBaseUrl } from "@repo/utils";

/**
 * Get action labels for notification categories.
 */
function getActionLabel(category: NotificationCategory): string {
	switch (category) {
		case "billing":
			return "View Billing";
		case "security":
			return "Security Settings";
		case "team":
			return "View Team";
		case "system":
			return "Learn More";
		default:
			return "View Details";
	}
}

/**
 * Internal function to send notification email to a user.
 */
async function sendNotificationEmail(
	userId: string,
	category: NotificationCategory,
	title: string,
	body: string,
	actionUrl?: string,
): Promise<boolean> {
	try {
		const user = await getUserById(userId);
		if (!user?.email) {
			logger.warn(
				`Cannot send notification email: user ${userId} has no email`,
			);
			return false;
		}

		const actionLabel = getActionLabel(category);

		return await sendEmail({
			to: user.email,
			templateId: "notificationEmail",
			context: {
				title,
				body,
				actionUrl,
				actionLabel: actionUrl ? actionLabel : undefined,
			},
		});
	} catch (error) {
		logger.error(
			`Failed to send notification email to user ${userId}:`,
			error,
		);
		return false;
	}
}

/**
 * Notification service for triggering notifications to users.
 * Handles both in-app notifications and emails based on user preferences.
 */
export const notificationService = {
	/**
	 * Send a notification to a single user.
	 */
	async sendToUser(params: {
		userId: string;
		category: NotificationCategory;
		type: NotificationType;
		title: string;
		body: string;
		actionUrl?: string;
	}) {
		return sendNotificationToUser(params, sendNotificationEmail);
	},

	/**
	 * Send a notification to all members of an organization.
	 */
	async sendToOrganizationMembers(params: {
		organizationId: string;
		category: NotificationCategory;
		type: NotificationType;
		title: string;
		body: string;
		actionUrl?: string;
	}) {
		const { organizationId, ...notificationParams } = params;
		return sendNotificationToOrganizationMembers(
			organizationId,
			notificationParams,
			sendNotificationEmail,
		);
	},

	/**
	 * Send a notification to organization admins/owners only.
	 */
	async sendToOrganizationAdmins(params: {
		organizationId: string;
		category: NotificationCategory;
		type: NotificationType;
		title: string;
		body: string;
		actionUrl?: string;
	}) {
		const { organizationId, ...notificationParams } = params;
		return sendNotificationToOrganizationAdmins(
			organizationId,
			notificationParams,
			sendNotificationEmail,
		);
	},
};

// =============================================================================
// Billing Notification Triggers
// =============================================================================

/**
 * Billing notification templates.
 */
export const billingNotifications = {
	/**
	 * Notify when a subscription is created/activated.
	 */
	async subscriptionCreated(params: {
		organizationId: string;
		planName: string;
	}) {
		const { organizationId, planName } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/billing`;

		return notificationService.sendToOrganizationAdmins({
			organizationId,
			category: "billing",
			type: "success",
			title: "Subscription Activated",
			body: `Your ${planName} subscription is now active. You can now access all the features included in your plan.`,
			actionUrl,
		});
	},

	/**
	 * Notify when a subscription is renewed (invoice paid).
	 */
	async subscriptionRenewed(params: {
		organizationId: string;
		planName: string;
	}) {
		const { organizationId, planName } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/billing`;

		return notificationService.sendToOrganizationAdmins({
			organizationId,
			category: "billing",
			type: "success",
			title: "Subscription Renewed",
			body: `Your ${planName} subscription has been renewed successfully. Your credits have been reset for the new billing period.`,
			actionUrl,
		});
	},

	/**
	 * Notify when a plan is upgraded.
	 */
	async planUpgraded(params: {
		organizationId: string;
		oldPlanName: string;
		newPlanName: string;
	}) {
		const { organizationId, oldPlanName, newPlanName } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/billing`;

		return notificationService.sendToOrganizationAdmins({
			organizationId,
			category: "billing",
			type: "success",
			title: "Plan Upgraded",
			body: `Your subscription has been upgraded from ${oldPlanName} to ${newPlanName}. Your additional credits are now available.`,
			actionUrl,
		});
	},

	/**
	 * Notify when a plan is downgraded.
	 */
	async planDowngraded(params: {
		organizationId: string;
		oldPlanName: string;
		newPlanName: string;
	}) {
		const { organizationId, oldPlanName, newPlanName } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/billing`;

		return notificationService.sendToOrganizationAdmins({
			organizationId,
			category: "billing",
			type: "info",
			title: "Plan Downgraded",
			body: `Your subscription has been changed from ${oldPlanName} to ${newPlanName}. The change will take effect at the start of your next billing period.`,
			actionUrl,
		});
	},

	/**
	 * Notify when a subscription is cancelled.
	 */
	async subscriptionCancelled(params: { organizationId: string }) {
		const { organizationId } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/billing`;

		return notificationService.sendToOrganizationAdmins({
			organizationId,
			category: "billing",
			type: "warning",
			title: "Subscription Cancelled",
			body: "Your subscription has been cancelled. You will continue to have access until the end of your current billing period.",
			actionUrl,
		});
	},

	/**
	 * Notify when a credit pack is purchased.
	 */
	async creditPackPurchased(params: {
		organizationId: string;
		packName: string;
		credits: number;
	}) {
		const { organizationId, packName, credits } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/billing`;

		return notificationService.sendToOrganizationAdmins({
			organizationId,
			category: "billing",
			type: "success",
			title: "Credit Pack Purchased",
			body: `You have successfully purchased the ${packName} pack. ${credits} credits have been added to your account.`,
			actionUrl,
		});
	},
};

// =============================================================================
// Security Notification Triggers
// =============================================================================

/**
 * Security notification templates.
 */
export const securityNotifications = {
	/**
	 * Notify when password is changed.
	 */
	async passwordChanged(params: { userId: string }) {
		const { userId } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/account`;

		return notificationService.sendToUser({
			userId,
			category: "security",
			type: "info",
			title: "Password Changed",
			body: "Your password has been changed successfully. If you did not make this change, please contact support immediately.",
			actionUrl,
		});
	},

	/**
	 * Notify when 2FA is enabled.
	 */
	async twoFactorEnabled(params: { userId: string }) {
		const { userId } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/account`;

		return notificationService.sendToUser({
			userId,
			category: "security",
			type: "success",
			title: "Two-Factor Authentication Enabled",
			body: "Two-factor authentication has been enabled for your account. Your account is now more secure.",
			actionUrl,
		});
	},

	/**
	 * Notify when 2FA is disabled.
	 */
	async twoFactorDisabled(params: { userId: string }) {
		const { userId } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/account`;

		return notificationService.sendToUser({
			userId,
			category: "security",
			type: "warning",
			title: "Two-Factor Authentication Disabled",
			body: "Two-factor authentication has been disabled for your account. We recommend keeping 2FA enabled for better security.",
			actionUrl,
		});
	},

	/**
	 * Notify when a new session is created from an unrecognized location/device.
	 * Note: This would need session tracking with device/location info to be fully implemented.
	 */
	async newLoginDetected(params: {
		userId: string;
		deviceInfo?: string;
		location?: string;
	}) {
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

		return notificationService.sendToUser({
			userId,
			category: "security",
			type: "info",
			title: "New Login Detected",
			body,
			actionUrl,
		});
	},
};

// =============================================================================
// Team Notification Triggers
// =============================================================================

/**
 * Team notification templates.
 */
export const teamNotifications = {
	/**
	 * Notify when someone accepts an invitation and joins the team.
	 */
	async memberJoined(params: {
		organizationId: string;
		memberName: string;
		memberEmail: string;
	}) {
		const { organizationId, memberName, memberEmail } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/team`;
		const displayName = memberName || memberEmail;

		return notificationService.sendToOrganizationAdmins({
			organizationId,
			category: "team",
			type: "info",
			title: "New Team Member",
			body: `${displayName} has joined your team.`,
			actionUrl,
		});
	},

	/**
	 * Notify when a member leaves the team.
	 */
	async memberLeft(params: {
		organizationId: string;
		memberName: string;
		memberEmail: string;
	}) {
		const { organizationId, memberName, memberEmail } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/team`;
		const displayName = memberName || memberEmail;

		return notificationService.sendToOrganizationAdmins({
			organizationId,
			category: "team",
			type: "info",
			title: "Team Member Left",
			body: `${displayName} has left your team.`,
			actionUrl,
		});
	},

	/**
	 * Notify a user when their role is changed.
	 */
	async roleChanged(params: {
		userId: string;
		organizationName: string;
		newRole: string;
	}) {
		const { userId, organizationName, newRole } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/team`;

		return notificationService.sendToUser({
			userId,
			category: "team",
			type: "info",
			title: "Role Changed",
			body: `Your role in ${organizationName} has been changed to ${newRole}.`,
			actionUrl,
		});
	},

	/**
	 * Notify when an invitation is received.
	 * Note: This is already handled by Better Auth's sendInvitationEmail, but we add an in-app notification too.
	 */
	async invitationReceived(params: {
		userId: string;
		organizationName: string;
	}) {
		const { userId, organizationName } = params;
		const actionUrl = `${getBaseUrl()}/app`;

		return notificationService.sendToUser({
			userId,
			category: "team",
			type: "info",
			title: "Team Invitation",
			body: `You have been invited to join ${organizationName}.`,
			actionUrl,
		});
	},
};

// =============================================================================
// System Notification Triggers
// =============================================================================

/**
 * System notification templates.
 */
export const systemNotifications = {
	/**
	 * Notify about scheduled maintenance.
	 */
	async scheduledMaintenance(params: {
		userId: string;
		maintenanceDate: string;
		duration?: string;
	}) {
		const { userId, maintenanceDate, duration } = params;

		let body = `Scheduled maintenance is planned for ${maintenanceDate}.`;
		if (duration) {
			body += ` Expected duration: ${duration}.`;
		}
		body +=
			" Some features may be temporarily unavailable during this time.";

		return notificationService.sendToUser({
			userId,
			category: "system",
			type: "info",
			title: "Scheduled Maintenance",
			body,
		});
	},

	/**
	 * Notify about a new feature.
	 */
	async newFeatureAnnouncement(params: {
		userId: string;
		featureName: string;
		description: string;
		learnMoreUrl?: string;
	}) {
		const { userId, featureName, description, learnMoreUrl } = params;

		return notificationService.sendToUser({
			userId,
			category: "system",
			type: "info",
			title: `New Feature: ${featureName}`,
			body: description,
			actionUrl: learnMoreUrl,
		});
	},
};

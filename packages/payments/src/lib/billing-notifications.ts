import {
	createNotification,
	db,
	getUserById,
	shouldSendNotification,
} from "@repo/database";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { getBaseUrl } from "@repo/utils";

/**
 * Send notification email for billing events.
 */
async function sendBillingNotificationEmail(
	userId: string,
	title: string,
	body: string,
	actionUrl?: string,
): Promise<boolean> {
	try {
		const user = await getUserById(userId);
		if (!user?.email) {
			logger.warn(
				`Cannot send billing notification email: user ${userId} has no email`,
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
				actionLabel: actionUrl ? "View Billing" : undefined,
			},
		});
	} catch (error) {
		logger.error(
			`Failed to send billing notification email to user ${userId}:`,
			error,
		);
		return false;
	}
}

/**
 * Send a billing notification to organization admins.
 * Respects user notification preferences for both in-app and email.
 */
async function notifyOrganizationAdmins(
	organizationId: string,
	title: string,
	body: string,
	type: "info" | "success" | "warning" | "error" = "info",
): Promise<void> {
	const actionUrl = `${getBaseUrl()}/app/settings/billing`;

	// Get admins and owners of the organization
	const admins = await db.member.findMany({
		where: {
			organizationId,
			role: { in: ["admin", "owner"] },
		},
		select: { userId: true },
	});

	for (const admin of admins) {
		const { userId } = admin;

		// Check in-app preference
		const shouldSendInApp = await shouldSendNotification(
			userId,
			"billing",
			"inApp",
		);
		if (shouldSendInApp) {
			try {
				await createNotification({
					userId,
					type,
					category: "billing",
					title,
					body,
					actionUrl,
				});
				logger.info(
					`Created billing notification for user ${userId}: ${title}`,
				);
			} catch (error) {
				logger.error(
					`Failed to create billing notification for user ${userId}:`,
					error,
				);
			}
		}

		// Check email preference
		const shouldSendEmail = await shouldSendNotification(
			userId,
			"billing",
			"email",
		);
		if (shouldSendEmail) {
			await sendBillingNotificationEmail(userId, title, body, actionUrl);
		}
	}
}

/**
 * Billing notification triggers for Stripe webhook events.
 */
export const billingNotifications = {
	/**
	 * Notify when a subscription is created/activated.
	 */
	async subscriptionCreated(params: {
		organizationId: string;
		planName: string;
	}): Promise<void> {
		const { organizationId, planName } = params;

		await notifyOrganizationAdmins(
			organizationId,
			"Subscription Activated",
			`Your ${planName} subscription is now active. You can now access all the features included in your plan.`,
			"success",
		);
	},

	/**
	 * Notify when a subscription is renewed (invoice paid).
	 */
	async subscriptionRenewed(params: {
		organizationId: string;
		planName: string;
	}): Promise<void> {
		const { organizationId, planName } = params;

		await notifyOrganizationAdmins(
			organizationId,
			"Subscription Renewed",
			`Your ${planName} subscription has been renewed successfully. Your credits have been reset for the new billing period.`,
			"success",
		);
	},

	/**
	 * Notify when a plan is upgraded.
	 */
	async planUpgraded(params: {
		organizationId: string;
		oldPlanName: string;
		newPlanName: string;
	}): Promise<void> {
		const { organizationId, oldPlanName, newPlanName } = params;

		await notifyOrganizationAdmins(
			organizationId,
			"Plan Upgraded",
			`Your subscription has been upgraded from ${oldPlanName} to ${newPlanName}. Your additional credits are now available.`,
			"success",
		);
	},

	/**
	 * Notify when a plan is downgraded.
	 */
	async planDowngraded(params: {
		organizationId: string;
		oldPlanName: string;
		newPlanName: string;
	}): Promise<void> {
		const { organizationId, oldPlanName, newPlanName } = params;

		await notifyOrganizationAdmins(
			organizationId,
			"Plan Downgraded",
			`Your subscription has been changed from ${oldPlanName} to ${newPlanName}. The change will take effect at the start of your next billing period.`,
			"info",
		);
	},

	/**
	 * Notify when a subscription is cancelled.
	 */
	async subscriptionCancelled(params: {
		organizationId: string;
	}): Promise<void> {
		const { organizationId } = params;

		await notifyOrganizationAdmins(
			organizationId,
			"Subscription Cancelled",
			"Your subscription has been cancelled. You will continue to have access until the end of your current billing period.",
			"warning",
		);
	},

	/**
	 * Notify when a credit pack is purchased.
	 */
	async creditPackPurchased(params: {
		organizationId: string;
		packName: string;
		credits: number;
	}): Promise<void> {
		const { organizationId, packName, credits } = params;

		await notifyOrganizationAdmins(
			organizationId,
			"Credit Pack Purchased",
			`You have successfully purchased the ${packName} pack. ${credits} credits have been added to your account.`,
			"success",
		);
	},
};

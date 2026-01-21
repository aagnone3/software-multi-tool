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
 * Send notification email for team events.
 */
async function sendTeamNotificationEmail(
	userId: string,
	title: string,
	body: string,
	actionUrl?: string,
): Promise<boolean> {
	try {
		const user = await getUserById(userId);
		if (!user?.email) {
			logger.warn(
				`Cannot send team notification email: user ${userId} has no email`,
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
				actionLabel: actionUrl ? "View Team" : undefined,
			},
		});
	} catch (error) {
		logger.error(
			`Failed to send team notification email to user ${userId}:`,
			error,
		);
		return false;
	}
}

/**
 * Send a team notification to a user.
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
		"team",
		"inApp",
	);
	if (shouldSendInApp) {
		try {
			await createNotification({
				userId,
				type,
				category: "team",
				title,
				body,
				actionUrl,
			});
			logger.info(
				`Created team notification for user ${userId}: ${title}`,
			);
		} catch (error) {
			logger.error(
				`Failed to create team notification for user ${userId}:`,
				error,
			);
		}
	}

	// Check email preference
	const shouldSendEmail = await shouldSendNotification(
		userId,
		"team",
		"email",
	);
	if (shouldSendEmail) {
		await sendTeamNotificationEmail(userId, title, body, actionUrl);
	}
}

/**
 * Send a team notification to organization admins.
 */
async function notifyOrganizationAdmins(
	organizationId: string,
	title: string,
	body: string,
	type: "info" | "success" | "warning" | "error" = "info",
): Promise<void> {
	const actionUrl = `${getBaseUrl()}/app/settings/team`;

	// Get admins and owners of the organization
	const admins = await db.member.findMany({
		where: {
			organizationId,
			role: { in: ["admin", "owner"] },
		},
		select: { userId: true },
	});

	for (const admin of admins) {
		await notifyUser(admin.userId, title, body, type, actionUrl);
	}
}

/**
 * Team notification triggers for organization events.
 */
export const teamNotifications = {
	/**
	 * Notify when someone accepts an invitation and joins the team.
	 */
	async memberJoined(params: {
		organizationId: string;
		organizationName: string;
		memberName: string;
		memberEmail: string;
	}): Promise<void> {
		const { organizationId, organizationName, memberName, memberEmail } =
			params;
		const displayName = memberName || memberEmail;

		await notifyOrganizationAdmins(
			organizationId,
			"New Team Member",
			`${displayName} has joined ${organizationName}.`,
			"info",
		);
	},

	/**
	 * Notify when a member leaves the team or is removed.
	 */
	async memberLeft(params: {
		organizationId: string;
		organizationName: string;
		memberName: string;
		memberEmail: string;
	}): Promise<void> {
		const { organizationId, organizationName, memberName, memberEmail } =
			params;
		const displayName = memberName || memberEmail;

		await notifyOrganizationAdmins(
			organizationId,
			"Team Member Left",
			`${displayName} has left ${organizationName}.`,
			"info",
		);
	},

	/**
	 * Notify a user when their role is changed.
	 */
	async roleChanged(params: {
		userId: string;
		organizationName: string;
		newRole: string;
	}): Promise<void> {
		const { userId, organizationName, newRole } = params;
		const actionUrl = `${getBaseUrl()}/app/settings/team`;

		// Format the role name nicely
		const formattedRole =
			newRole.charAt(0).toUpperCase() + newRole.slice(1);

		await notifyUser(
			userId,
			"Role Changed",
			`Your role in ${organizationName} has been changed to ${formattedRole}.`,
			"info",
			actionUrl,
		);
	},
};

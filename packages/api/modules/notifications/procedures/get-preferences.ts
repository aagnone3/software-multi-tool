import { getNotificationPreferences } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";

export const getPreferencesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications/preferences",
		tags: ["Notifications"],
		summary: "Get notification preferences for current user",
	})
	.handler(async ({ context }) => {
		const preferences = await getNotificationPreferences(context.user.id);
		return { preferences };
	});

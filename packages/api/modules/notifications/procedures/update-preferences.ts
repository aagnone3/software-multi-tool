import { updateNotificationPreferences } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const channelPreferencesSchema = z.object({
	inApp: z.boolean(),
	email: z.boolean(),
});

const updatePreferencesInputSchema = z.object({
	billing: channelPreferencesSchema.optional(),
	security: channelPreferencesSchema.optional(),
	team: channelPreferencesSchema.optional(),
	system: channelPreferencesSchema.optional(),
});

export const updatePreferencesProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/notifications/preferences",
		tags: ["Notifications"],
		summary: "Update notification preferences for current user",
	})
	.input(updatePreferencesInputSchema)
	.handler(async ({ input, context }) => {
		const preferences = await updateNotificationPreferences(
			context.user.id,
			input,
		);
		return { preferences };
	});

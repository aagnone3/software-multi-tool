"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { useSession } from "@saas/auth/hooks/use-session";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	email: z.string().email(),
});

type FormSchema = z.infer<typeof formSchema>;

export function ChangeEmailForm() {
	const { user, reloadSession } = useSession();
	const { track } = useProductAnalytics();

	const form = useForm<FormSchema>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: user?.email ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ email }) => {
		const { error } = await authClient.changeEmail({
			newEmail: email,
		});

		if (error) {
			toast.error("Could not update email");
			track({ name: "settings_email_change_failed", props: {} });
			return;
		}

		toast.success("Email was updated successfully");
		track({ name: "settings_email_changed", props: {} });

		reloadSession();
	});

	return (
		<SettingsItem
			title="Your email"
			description="To change your email, enter the new email and hit save. You will have to confirm the new email before it will become active."
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					onSubmit();
				}}
			>
				<Input type="email" {...form.register("email")} />

				<div className="mt-4 flex justify-end">
					<Button
						type="submit"
						loading={form.formState.isSubmitting}
						disabled={
							!(
								form.formState.isValid &&
								form.formState.dirtyFields.email
							)
						}
					>
						Save
					</Button>
				</div>
			</form>
		</SettingsItem>
	);
}

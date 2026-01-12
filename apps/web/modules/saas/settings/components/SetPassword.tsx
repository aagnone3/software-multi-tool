"use client";
import { authClient } from "@repo/auth/client";
import { useSession } from "@saas/auth/hooks/use-session";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { Button } from "@ui/components/button";
import { useState } from "react";
import { toast } from "sonner";

export function SetPasswordForm() {
	const { user } = useSession();
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async () => {
		if (!user) {
			return;
		}

		setSubmitting(true);

		await authClient.requestPasswordReset(
			{
				email: user.email,
				redirectTo: `${window.location.origin}/auth/reset-password`,
			},
			{
				onSuccess: () => {
					toast.success(
						"Check your inbox for the link to set your password.",
					);
				},
				onError: () => {
					toast.error(
						"Could not send link to set password. Please try again.",
					);
				},
				onResponse: () => {
					setSubmitting(false);
				},
			},
		);
	};

	return (
		<SettingsItem
			title="Your password"
			description="You have not set a password yet. To set one, you need to go through the password reset flow. Click the button below to send an email to reset your password and follow the instructions in the email."
		>
			<div className="flex justify-end">
				<Button type="submit" loading={submitting} onClick={onSubmit}>
					Set password
				</Button>
			</div>
		</SettingsItem>
	);
}

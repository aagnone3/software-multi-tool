"use client";

import { authClient } from "@repo/auth/client";
import { useSession } from "@saas/auth/hooks/use-session";
import { useConfirmationAlert } from "@saas/shared/components/ConfirmationAlertProvider";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { toast } from "sonner";

export function DeleteAccountForm() {
	const { reloadSession } = useSession();
	const { confirm } = useConfirmationAlert();

	const deleteUserMutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.deleteUser({});

			if (error) {
				throw error;
			}
		},
		onSuccess: () => {
			toast.success("Account was deleted successfully");
			reloadSession();
		},
		onError: () => {
			toast.error("Could not delete account");
		},
	});

	const confirmDelete = () => {
		confirm({
			title: "Delete account",
			message: "Are you sure you want to delete your account?",
			onConfirm: async () => {
				await deleteUserMutation.mutateAsync();
			},
		});
	};

	return (
		<SettingsItem
			danger
			title="Delete account"
			description="Permanently delete your account. Once you delete your account, there is no going back. To confirm, please enter your password below:"
		>
			<div className="mt-4 flex justify-end">
				<Button variant="error" onClick={() => confirmDelete()}>
					Delete account
				</Button>
			</div>
		</SettingsItem>
	);
}

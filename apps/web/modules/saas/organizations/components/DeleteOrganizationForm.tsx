"use client";

import { authClient } from "@repo/auth/client";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useOrganizationListQuery } from "@saas/organizations/lib/api";
import { useConfirmationAlert } from "@saas/shared/components/ConfirmationAlertProvider";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { useRouter } from "@shared/hooks/router";
import { Button } from "@ui/components/button";
import { toast } from "sonner";

export function DeleteOrganizationForm() {
	const router = useRouter();
	const { confirm } = useConfirmationAlert();
	const { refetch: reloadOrganizations } = useOrganizationListQuery();
	const { activeOrganization, setActiveOrganization } =
		useActiveOrganization();

	if (!activeOrganization) {
		return null;
	}

	const handleDelete = async () => {
		confirm({
			title: "Delete organization",
			message: "Are you sure you want to delete your organization?",
			destructive: true,
			onConfirm: async () => {
				const { error } = await authClient.organization.delete({
					organizationId: activeOrganization.id,
				});

				if (error) {
					toast.error(
						"We were unable to delete your organization. Please try again later.",
					);
					return;
				}

				toast.success("Your organization has been deleted.");
				await setActiveOrganization(null);
				await reloadOrganizations();
				router.replace("/app");
			},
		});
	};

	return (
		<SettingsItem
			danger
			title="Delete organization"
			description="Permanently delete your organization. Once you delete your organization, there is no going back. To confirm, please enter your password below:"
		>
			<div className="mt-4 flex justify-end">
				<Button variant="error" onClick={handleDelete}>
					Delete organization
				</Button>
			</div>
		</SettingsItem>
	);
}

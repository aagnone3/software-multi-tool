import { getSession } from "@saas/auth/lib/server";
import { NotificationPreferencesForm } from "@saas/settings/components/NotificationPreferencesForm";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { SettingsList } from "@saas/shared/components/SettingsList";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	return {
		title: "Notification preferences",
	};
}

export default async function NotificationSettingsPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	return (
		<SettingsList>
			<SettingsItem
				title="Notification preferences"
				description="Control which notifications you receive and through which channels."
			>
				<NotificationPreferencesForm />
			</SettingsItem>
		</SettingsList>
	);
}

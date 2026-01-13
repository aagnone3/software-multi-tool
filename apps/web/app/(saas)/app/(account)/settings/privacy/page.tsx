import { getSession } from "@saas/auth/lib/server";
import { DataExportForm } from "@saas/settings/components/DataExportForm";
import { SettingsList } from "@saas/shared/components/SettingsList";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	return {
		title: "Privacy settings",
	};
}

export default async function PrivacySettingsPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	return (
		<SettingsList>
			<DataExportForm />
		</SettingsList>
	);
}

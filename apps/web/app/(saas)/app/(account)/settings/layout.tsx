import { config } from "@repo/config";
import { getSession } from "@saas/auth/lib/server";
import { SettingsMenu } from "@saas/settings/components/SettingsMenu";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { SidebarContentLayout } from "@saas/shared/components/SidebarContentLayout";
import { UserAvatar } from "@shared/components/UserAvatar";
import {
	CreditCardIcon,
	DownloadIcon,
	LockKeyholeIcon,
	SettingsIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function SettingsLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	const menuItems = [
		{
			title: "Account",
			avatar: (
				<UserAvatar
					name={session.user.name ?? ""}
					avatarUrl={session.user.image}
				/>
			),
			items: [
				{
					title: "General",
					href: "/app/settings/general",
					icon: <SettingsIcon className="size-4 opacity-50" />,
				},
				{
					title: "Security",
					href: "/app/settings/security",
					icon: <LockKeyholeIcon className="size-4 opacity-50" />,
				},
				...(config.users.enableBilling
					? [
							{
								title: "Billing",
								href: "/app/settings/billing",
								icon: (
									<CreditCardIcon className="size-4 opacity-50" />
								),
							},
						]
					: []),
				{
					title: "Privacy",
					href: "/app/settings/privacy",
					icon: <DownloadIcon className="size-4 opacity-50" />,
				},
				{
					title: "Danger zone",
					href: "/app/settings/danger-zone",
					icon: <TriangleAlertIcon className="size-4 opacity-50" />,
				},
			],
		},
	];

	return (
		<>
			<PageHeader
				title="Account settings"
				subtitle="Manage the settings of your personal account."
			/>
			<SidebarContentLayout
				sidebar={<SettingsMenu menuItems={menuItems} />}
			>
				{children}
			</SidebarContentLayout>
		</>
	);
}

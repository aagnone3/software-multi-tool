import { isOrganizationAdmin } from "@repo/auth/lib/helper";
import { config } from "@repo/config";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { OrganizationLogo } from "@saas/organizations/components/OrganizationLogo";
import { SettingsMenu } from "@saas/settings/components/SettingsMenu";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { SidebarContentLayout } from "@saas/shared/components/SidebarContentLayout";
import {
	CreditCardIcon,
	Settings2Icon,
	TriangleAlertIcon,
	Users2Icon,
} from "lucide-react";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function SettingsLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ organizationSlug: string }>;
}>) {
	const session = await getSession();
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		redirect("/app");
	}

	const userIsOrganizationAdmin = isOrganizationAdmin(
		organization,
		session?.user,
	);

	const organizationSettingsBasePath = `/app/${organizationSlug}/settings`;

	const menuItems = [
		{
			title: "Organization",
			avatar: (
				<OrganizationLogo
					name={organization.name}
					logoUrl={organization.logo}
				/>
			),
			items: [
				{
					title: "General",
					href: `${organizationSettingsBasePath}/general`,
					icon: <Settings2Icon className="size-4 opacity-50" />,
				},
				{
					title: "Members",
					href: `${organizationSettingsBasePath}/members`,
					icon: <Users2Icon className="size-4 opacity-50" />,
				},
				...(config.organizations.enable &&
				config.organizations.enableBilling &&
				userIsOrganizationAdmin
					? [
							{
								title: "Billing",
								href: `${organizationSettingsBasePath}/billing`,
								icon: (
									<CreditCardIcon className="size-4 opacity-50" />
								),
							},
						]
					: []),
				...(userIsOrganizationAdmin
					? [
							{
								title: "Danger zone",
								href: `${organizationSettingsBasePath}/danger-zone`,
								icon: (
									<TriangleAlertIcon className="size-4 opacity-50" />
								),
							},
						]
					: []),
			],
		},
	];

	return (
		<>
			<PageHeader
				title="Organization"
				subtitle="Manage the settings of the organization."
			/>
			<SidebarContentLayout
				sidebar={<SettingsMenu menuItems={menuItems} />}
			>
				{children}
			</SidebarContentLayout>
		</>
	);
}

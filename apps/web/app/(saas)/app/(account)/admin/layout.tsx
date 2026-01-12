import { config } from "@repo/config";
import { getSession } from "@saas/auth/lib/server";
import { SettingsMenu } from "@saas/settings/components/SettingsMenu";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { SidebarContentLayout } from "@saas/shared/components/SidebarContentLayout";
import { Logo } from "@shared/components/Logo";
import { Building2Icon, ScrollTextIcon, UsersIcon } from "lucide-react";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	if (session.user?.role !== "admin") {
		redirect("/app");
	}

	return (
		<>
			<PageHeader
				title="Administration"
				subtitle="Manage your application."
			/>
			<SidebarContentLayout
				sidebar={
					<SettingsMenu
						menuItems={[
							{
								avatar: (
									<Logo
										className="size-8"
										withLabel={false}
									/>
								),
								title: "Administration",
								items: [
									{
										title: "Users",
										href: "/app/admin/users",
										icon: (
											<UsersIcon className="size-4 opacity-50" />
										),
									},
									...(config.organizations.enable
										? [
												{
													title: "Organizations",
													href: "/app/admin/organizations",
													icon: (
														<Building2Icon className="size-4 opacity-50" />
													),
												},
											]
										: []),
									{
										title: "Audit Logs",
										href: "/app/admin/audit-logs",
										icon: (
											<ScrollTextIcon className="size-4 opacity-50" />
										),
									},
								],
							},
						]}
					/>
				}
			>
				{children}
			</SidebarContentLayout>
		</>
	);
}

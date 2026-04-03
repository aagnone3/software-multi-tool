"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { config } from "@repo/config";
import { OrganizationLogo } from "@saas/organizations/components/OrganizationLogo";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useOrganizationListQuery } from "@saas/organizations/lib/api";
import { Card } from "@ui/components/card";
import { ChevronRightIcon, PlusCircleIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

export function OrganizationsGrid() {
	const { setActiveOrganization } = useActiveOrganization();
	const { data: allOrganizations } = useOrganizationListQuery();
	const { track } = useProductAnalytics();

	return (
		<div className="@container">
			<h2 className="mb-2 font-semibold text-lg">Your organizations</h2>
			<div className="grid @2xl:grid-cols-3 @lg:grid-cols-2 grid-cols-1 gap-4">
				{allOrganizations?.map((organization) => (
					<Card
						key={organization.id}
						className="flex cursor-pointer items-center gap-4 overflow-hidden p-4"
						onClick={() => {
							track({
								name: "organization_switched",
								props: { organization_slug: organization.slug },
							});
							setActiveOrganization(organization.slug);
						}}
					>
						<OrganizationLogo
							name={organization.name}
							logoUrl={organization.logo}
							className="size-12"
						/>
						<span className="flex items-center gap-1 text-base leading-tight">
							<span className="block font-medium">
								{organization.name}
							</span>
							<ChevronRightIcon className="size-4" />
						</span>
					</Card>
				))}

				{config.organizations.enableUsersToCreateOrganizations && (
					<Link
						href="/new-organization"
						className="flex h-full items-center justify-center gap-2 rounded-2xl bg-primary/5 p-4 text-primary transition-colors duration-150 hover:bg-primary/10"
					>
						<PlusCircleIcon />
						<span className="font-medium text-sm">
							Create new organization
						</span>
					</Link>
				)}
			</div>
		</div>
	);
}

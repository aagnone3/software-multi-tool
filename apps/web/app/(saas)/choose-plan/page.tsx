import { config } from "@repo/config";
import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { PricingTable } from "@saas/payments/components/PricingTable";
import { getPurchases } from "@saas/payments/lib/server";
import { AuthWrapper } from "@saas/shared/components/AuthWrapper";
import { attemptAsync } from "es-toolkit";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	return {
		title: "Choose your plan",
	};
}

export default async function ChoosePlanPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	let organizationId: string | undefined;
	if (config.organizations.enable && config.organizations.enableBilling) {
		const organization = (await getOrganizationList()).at(0);

		if (!organization) {
			redirect("/new-organization");
		}

		organizationId = organization.id;
	}

	const [error, purchases] = await attemptAsync(() =>
		getPurchases(organizationId),
	);

	if (error || !purchases) {
		throw new Error("Failed to fetch purchases");
	}

	const { activePlan } = createPurchasesHelper(purchases);

	if (activePlan) {
		redirect("/app");
	}

	return (
		<AuthWrapper contentClass="max-w-5xl">
			<div className="mb-4 text-center">
				<h1 className="text-center font-bold text-2xl lg:text-3xl">
					Choose your plan
				</h1>
				<p className="text-muted-foreground text-sm lg:text-base">
					To continue, please select a plan.
				</p>
			</div>

			<div>
				<PricingTable
					{...(organizationId
						? {
								organizationId,
							}
						: {
								userId: session.user.id,
							})}
				/>
			</div>
		</AuthWrapper>
	);
}

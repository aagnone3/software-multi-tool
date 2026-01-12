"use client";
import { PricingTable } from "@saas/payments/components/PricingTable";

export function PricingSection() {
	return (
		<section id="pricing" className="scroll-mt-16 py-12 lg:py-16">
			<div className="container max-w-5xl">
				<div className="mb-6 lg:text-center">
					<h1 className="font-bold text-4xl lg:text-5xl">Pricing</h1>
					<p className="mt-3 text-lg opacity-50">
						Choose the plan that works best for you.
					</p>
				</div>

				<PricingTable />
			</div>
		</section>
	);
}

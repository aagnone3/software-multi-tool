"use client";
import { PricingTable } from "@saas/payments/components/PricingTable";
import { PricingFaq } from "./PricingFaq";
import { PricingTrustBar } from "./PricingTrustBar";

export function PricingSection() {
	return (
		<section id="pricing" className="scroll-mt-16 py-12 lg:py-16">
			<div className="container max-w-5xl">
				<div className="mb-6 lg:text-center">
					<p className="mb-2 font-semibold text-primary text-sm uppercase tracking-wider">
						Simple, transparent pricing
					</p>
					<h2 className="font-bold text-4xl lg:text-5xl">
						Pay only for what you use
					</h2>
					<p className="mx-auto mt-3 max-w-xl text-foreground/60 text-lg">
						Start free. Add credits as you grow. No subscriptions
						required — credits never expire.
					</p>
				</div>

				<PricingTable />
				<PricingTrustBar />
				<PricingFaq />
			</div>
		</section>
	);
}

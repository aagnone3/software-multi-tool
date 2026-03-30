import { JobOutputCompare } from "@saas/jobs/components/JobOutputCompare";
import { UpgradeGate } from "@saas/payments/components/UpgradeGate";
import React from "react";

export async function generateMetadata() {
	return {
		title: "Compare Job Outputs",
		description: "Compare outputs from two different job runs side by side",
	};
}

export default function JobsComparePage() {
	return (
		<UpgradeGate
			featureName="Job Output Compare"
			description="Compare outputs from two different job runs side by side. Available on Pro and above."
		>
			<JobOutputCompare />
		</UpgradeGate>
	);
}

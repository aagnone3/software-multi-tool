import { JobOutputCompare } from "@saas/jobs/components/JobOutputCompare";

export async function generateMetadata() {
	return {
		title: "Compare Job Outputs",
		description: "Compare outputs from two different job runs side by side",
	};
}

export default function JobsComparePage() {
	return <JobOutputCompare />;
}

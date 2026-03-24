import { JobsHistoryPage } from "@saas/jobs/components/JobsHistoryPage";

export async function generateMetadata() {
	return {
		title: "Job History",
		description: "View all your tool runs and their results",
	};
}

export default function JobsPage() {
	return <JobsHistoryPage />;
}

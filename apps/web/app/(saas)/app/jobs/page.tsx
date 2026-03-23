import { JobsHistoryPage } from "@saas/jobs/components/JobsHistoryPage";

export const metadata = {
	title: "Job History",
	description: "View all your tool runs and their results",
};

export default function JobsPage() {
	return <JobsHistoryPage />;
}

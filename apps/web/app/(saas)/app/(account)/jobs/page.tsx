import { JobsHistoryPage } from "@saas/jobs/components/JobsHistoryPage";
import React from "react";

export async function generateMetadata() {
	return {
		title: "Job History",
		description: "View all your tool runs and their results",
	};
}

export default function JobsPage() {
	return <JobsHistoryPage />;
}

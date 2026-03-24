import { JobDetailPage } from "@saas/jobs/components/JobDetailPage";

interface JobDetailPageProps {
	params: Promise<{
		jobId: string;
	}>;
}

export async function generateMetadata() {
	return {
		title: "Job Details",
		description: "View the status and output of a tool run",
	};
}

export default async function JobDetailRoute({ params }: JobDetailPageProps) {
	const { jobId } = await params;
	return <JobDetailPage jobId={jobId} />;
}

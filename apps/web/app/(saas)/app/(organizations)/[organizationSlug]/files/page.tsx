import { getActiveOrganization } from "@saas/auth/lib/server";
import { FilesTable } from "@saas/files/components/FilesTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { redirect } from "next/navigation";

export default async function FilesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);
	const queryClient = getServerQueryClient();

	if (!organization) {
		redirect("/app");
	}

	// Prefetch files list
	await queryClient.prefetchQuery(
		orpc.files.list.queryOptions({
			input: {
				page: 1,
				pageSize: 20,
			},
		}),
	);

	// Prefetch tags
	await queryClient.prefetchQuery(orpc.files.listTags.queryOptions({}));

	return (
		<>
			<PageHeader
				title="Files"
				subtitle="View and manage all uploaded files across your organization"
			/>

			<FilesTable organizationId={organization.id} />
		</>
	);
}

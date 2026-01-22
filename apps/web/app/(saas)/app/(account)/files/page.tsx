import { getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { redirect } from "next/navigation";

export default async function AccountFilesPage() {
	const session = await getSession();

	if (!session?.user) {
		redirect("/auth/login");
	}

	// Files require an organization context
	return (
		<>
			<PageHeader
				title="Files"
				subtitle="Select an organization to view and manage files"
			/>

			<div className="text-center py-12 text-muted-foreground">
				<p>Please select an organization to view files.</p>
				<p className="text-sm mt-2">
					Files are organized by organization for better access
					control.
				</p>
			</div>
		</>
	);
}

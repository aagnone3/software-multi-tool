import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

export default async function AccountFilesPage() {
	const session = await getSession();

	if (!session?.user) {
		redirect("/auth/login");
	}

	// Files require an organization context - redirect to the first organization's files page
	const organizations = await getOrganizationList();

	if (organizations.length > 0) {
		// Redirect to the first organization's files page
		const firstOrg = organizations[0];
		redirect(`/app/${firstOrg.slug}/files`);
	}

	// User has no organizations - redirect to app home where they can create one
	redirect("/app");
}

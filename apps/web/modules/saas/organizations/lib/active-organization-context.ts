import type { ActiveOrganization } from "@repo/auth";
import React from "react";

export const ActiveOrganizationContext = React.createContext<
	| {
			activeOrganization: ActiveOrganization | null;
			activeOrganizationUserRole:
				| ActiveOrganization["members"][number]["role"]
				| null;
			isOrganizationAdmin: boolean;
			loaded: boolean;
			/**
			 * Whether the current route is an organization-scoped route (has organizationSlug in URL).
			 * Use this to determine if having no activeOrganization is expected (false) or a problem (true).
			 */
			isOrgRoute: boolean;
			setActiveOrganization: (
				organizationId: string | null,
			) => Promise<void>;
			refetchActiveOrganization: () => Promise<void>;
	  }
	| undefined
>(undefined);

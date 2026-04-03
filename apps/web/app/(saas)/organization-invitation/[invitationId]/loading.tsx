import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function OrganizationInvitationLoading() {
	return (
		<div className="flex flex-col items-center justify-center py-16 gap-6 max-w-md mx-auto text-center">
			{/* Avatar / org icon */}
			<Skeleton className="size-16 rounded-full" />

			{/* Title and description */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-72 mx-auto" />
				<Skeleton className="h-4 w-64 mx-auto" />
				<Skeleton className="h-4 w-48 mx-auto" />
			</div>

			{/* CTA buttons */}
			<div className="flex items-center gap-3">
				<Skeleton className="h-10 w-32 rounded-md" />
				<Skeleton className="h-10 w-24 rounded-md" />
			</div>
		</div>
	);
}

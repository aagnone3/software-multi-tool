import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function NewOrganizationLoading() {
	return (
		<div className="flex flex-col items-center gap-6 py-16 px-4 max-w-md mx-auto">
			<div className="space-y-2 text-center">
				<Skeleton className="h-8 w-56 mx-auto" />
				<Skeleton className="h-4 w-80 mx-auto" />
			</div>
			<div className="w-full space-y-4">
				<Skeleton className="h-10 w-full rounded-md" />
				<Skeleton className="h-10 w-full rounded-md" />
				<Skeleton className="h-11 w-full rounded-md" />
			</div>
		</div>
	);
}

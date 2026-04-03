import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function OrgDangerZoneLoading() {
	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<Skeleton className="h-7 w-32" />
				<Skeleton className="h-4 w-64" />
			</div>

			{/* Danger zone card */}
			<div className="rounded-xl border border-destructive/30 p-6 space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-4 w-full max-w-md" />
				</div>
				<Skeleton className="h-10 w-36 rounded-md" />
			</div>
		</div>
	);
}

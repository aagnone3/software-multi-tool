import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function OrgUsageSettingsLoading() {
	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<Skeleton className="h-7 w-36" />
				<Skeleton className="h-4 w-56" />
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl border p-5 space-y-3">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-16" />
						<Skeleton className="h-2 w-full rounded-full" />
					</div>
				))}
			</div>

			{/* Chart area */}
			<div className="rounded-xl border p-6 space-y-4">
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-48 w-full" />
			</div>
		</div>
	);
}

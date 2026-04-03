import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function GeneralSettingsLoading() {
	return (
		<div className="space-y-8">
			{/* Avatar section */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-28" />
				<div className="flex items-center gap-4">
					<Skeleton className="size-16 rounded-full" />
					<Skeleton className="h-9 w-28 rounded-md" />
				</div>
			</div>

			{/* Name / email fields */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-24" />
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="space-y-1">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-10 w-full rounded-md" />
						</div>
					))}
					<Skeleton className="h-9 w-24 rounded-md" />
				</div>
			</div>
		</div>
	);
}

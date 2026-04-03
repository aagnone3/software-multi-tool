import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function OrgGeneralSettingsLoading() {
	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<Skeleton className="h-7 w-40" />
				<Skeleton className="h-4 w-64" />
			</div>

			{/* Form fields */}
			<div className="space-y-6">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full rounded-md" />
					</div>
				))}
				<Skeleton className="h-10 w-28 rounded-md" />
			</div>
		</div>
	);
}

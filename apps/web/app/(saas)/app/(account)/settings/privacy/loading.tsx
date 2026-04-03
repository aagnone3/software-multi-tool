import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function PrivacySettingsLoading() {
	return (
		<div className="space-y-8">
			{/* Cookie consent */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-36" />
				<div className="rounded-xl border p-5 space-y-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
					<div className="flex gap-2 pt-1">
						<Skeleton className="h-9 w-24 rounded-md" />
						<Skeleton className="h-9 w-28 rounded-md" />
					</div>
				</div>
			</div>

			{/* Data export */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-28" />
				<div className="rounded-xl border p-5 space-y-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-9 w-32 rounded-md" />
				</div>
			</div>
		</div>
	);
}

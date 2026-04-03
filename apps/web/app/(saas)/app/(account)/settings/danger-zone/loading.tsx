import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function DangerZoneSettingsLoading() {
	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<Skeleton className="h-6 w-28" />
				<div className="rounded-xl border border-destructive/20 p-5 space-y-3">
					<div className="space-y-1">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-72" />
					</div>
					<Skeleton className="h-9 w-32 rounded-md" />
				</div>
			</div>
		</div>
	);
}

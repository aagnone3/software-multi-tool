import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function OrgSettingsLoading() {
	return (
		<div className="container max-w-4xl py-8 space-y-8">
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-80" />
			</div>

			{/* Content layout with sidebar */}
			<div className="grid grid-cols-[200px_1fr] gap-8">
				{/* Sidebar nav */}
				<div className="space-y-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={String(i)} className="h-9 w-full" />
					))}
				</div>

				{/* Settings content */}
				<div className="space-y-6">
					<div className="rounded-lg border p-6 space-y-4">
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-64" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-24" />
					</div>
					<div className="rounded-lg border p-6 space-y-4">
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-64" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-24" />
					</div>
				</div>
			</div>
		</div>
	);
}

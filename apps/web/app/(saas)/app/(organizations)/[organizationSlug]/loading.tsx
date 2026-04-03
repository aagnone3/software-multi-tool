import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function OrganizationLoading() {
	return (
		<div className="space-y-6">
			{/* Page header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-64" />
			</div>

			{/* Stats row */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl border p-5 space-y-3">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-16" />
					</div>
				))}
			</div>

			{/* Content area */}
			<div className="rounded-xl border p-6 space-y-4">
				<Skeleton className="h-6 w-32" />
				<div className="space-y-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-12 w-full" />
					))}
				</div>
			</div>
		</div>
	);
}

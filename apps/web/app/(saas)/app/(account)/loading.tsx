import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function DashboardLoading() {
	return (
		<div className="space-y-6">
			{/* Welcome header skeleton */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-72" />
			</div>

			{/* Stats row skeleton */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-lg border p-4 space-y-3">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-16" />
					</div>
				))}
			</div>

			{/* Widget grid skeleton */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="rounded-lg border p-4 space-y-3">
						<div className="flex items-center gap-2">
							<Skeleton className="size-4 rounded" />
							<Skeleton className="h-4 w-32" />
						</div>
						<Skeleton className="h-20 w-full" />
					</div>
				))}
			</div>
		</div>
	);
}

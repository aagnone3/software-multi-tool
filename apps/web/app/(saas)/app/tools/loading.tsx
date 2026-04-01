import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function ToolsLoading() {
	return (
		<div>
			{/* Page header skeleton */}
			<div className="flex items-center justify-between mb-6">
				<div className="space-y-2">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-4 w-64" />
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-28" />
				</div>
			</div>

			{/* Welcome banner skeleton */}
			<Skeleton className="h-16 w-full rounded-lg mb-6" />

			{/* Tools grid skeleton */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="rounded-lg border p-6 space-y-3">
						<div className="flex items-center gap-3">
							<Skeleton className="h-10 w-10 rounded-md" />
							<Skeleton className="h-5 w-32" />
						</div>
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-8 w-full rounded-md mt-2" />
					</div>
				))}
			</div>
		</div>
	);
}

import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function JobsLoading() {
	return (
		<div className="space-y-6">
			{/* Page header skeleton */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-56" />
				</div>
				<Skeleton className="h-9 w-28" />
			</div>

			{/* Filter/search bar skeleton */}
			<div className="flex items-center gap-3">
				<Skeleton className="h-9 w-64" />
				<Skeleton className="h-9 w-28" />
				<Skeleton className="h-9 w-28" />
			</div>

			{/* Job rows skeleton */}
			<div className="rounded-lg border divide-y">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="flex items-center gap-4 p-4">
						<Skeleton className="size-9 rounded-md shrink-0" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-3 w-32" />
						</div>
						<Skeleton className="h-5 w-20 rounded-full" />
						<Skeleton className="h-8 w-8 rounded-md" />
					</div>
				))}
			</div>
		</div>
	);
}

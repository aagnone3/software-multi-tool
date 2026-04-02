import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function FilesLoading() {
	return (
		<div>
			{/* Page header skeleton */}
			<div className="flex items-center justify-between mb-6">
				<div className="space-y-2">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-4 w-48" />
				</div>
				<Skeleton className="h-9 w-28 rounded-md" />
			</div>

			{/* Search/filter bar skeleton */}
			<div className="flex items-center gap-3 mb-4">
				<Skeleton className="h-9 flex-1 rounded-md" />
				<Skeleton className="h-9 w-24 rounded-md" />
			</div>

			{/* Files table skeleton */}
			<div className="rounded-md border">
				{/* Table header */}
				<div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
					<Skeleton className="h-4 w-4 rounded" />
					<Skeleton className="h-4 w-48" />
					<Skeleton className="h-4 w-24 ml-auto" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-16" />
				</div>

				{/* Table rows */}
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
						key={i}
						className="flex items-center gap-4 px-4 py-3 border-b last:border-0"
					>
						<Skeleton className="h-4 w-4 rounded" />
						<div className="flex items-center gap-2 flex-1">
							<Skeleton className="h-5 w-5 rounded shrink-0" />
							<Skeleton className="h-4 w-48" />
						</div>
						<Skeleton className="h-4 w-20 ml-auto" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-8 rounded" />
					</div>
				))}
			</div>
		</div>
	);
}

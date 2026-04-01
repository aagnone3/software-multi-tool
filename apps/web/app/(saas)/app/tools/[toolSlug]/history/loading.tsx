import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function ToolHistoryLoading() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-40" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-8 w-24 rounded-md" />
					<Skeleton className="h-8 w-28 rounded-md" />
				</div>
			</div>

			{/* Stats cards */}
			<div className="grid grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-lg border p-4 space-y-2">
						<Skeleton className="h-3 w-20" />
						<Skeleton className="h-8 w-12" />
					</div>
				))}
			</div>

			{/* Table */}
			<div className="rounded-lg border p-6 space-y-4">
				<Skeleton className="h-5 w-12" />
				{/* Filters */}
				<div className="flex gap-2">
					<Skeleton className="h-8 w-48 rounded-md" />
					<Skeleton className="h-8 w-32 rounded-md" />
					<Skeleton className="h-8 w-36 rounded-md" />
					<Skeleton className="h-8 w-36 rounded-md" />
				</div>
				{/* Table rows */}
				<div className="space-y-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-10 w-full" />
					))}
				</div>
			</div>
		</div>
	);
}

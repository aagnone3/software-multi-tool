import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function ToolInsightsLoading() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-4 w-64" />
			</div>

			{/* Stats row */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-lg border p-4 space-y-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-8 w-14" />
					</div>
				))}
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Skeleton className="h-64 w-full rounded-lg" />
				<Skeleton className="h-64 w-full rounded-lg" />
			</div>

			{/* Table */}
			<div className="rounded-lg border p-4 space-y-3">
				<Skeleton className="h-6 w-32" />
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-10 w-full rounded-md" />
				))}
			</div>
		</div>
	);
}

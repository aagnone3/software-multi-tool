import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function UsageHistoryLoading() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Skeleton className="h-9 w-9 rounded-md" />
				<div className="space-y-1">
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>

			{/* Summary cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-lg border p-4 space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-16" />
					</div>
				))}
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Skeleton className="h-64 w-full rounded-lg" />
				<Skeleton className="h-64 w-full rounded-lg" />
			</div>

			{/* Transaction history table */}
			<div className="rounded-lg border p-4 space-y-3">
				<Skeleton className="h-6 w-40" />
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-10 w-full rounded-md" />
				))}
			</div>
		</div>
	);
}

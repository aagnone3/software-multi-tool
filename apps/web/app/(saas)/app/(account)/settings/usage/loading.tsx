import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function UsageSettingsLoading() {
	return (
		<div className="space-y-8">
			{/* Summary cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-xl border p-4 space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-7 w-16" />
					</div>
				))}
			</div>

			{/* Chart */}
			<div className="space-y-3">
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-48 w-full rounded-xl" />
			</div>

			{/* Transaction history */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-6 w-36" />
					<Skeleton className="h-9 w-28 rounded-md" />
				</div>
				<div className="rounded-xl border divide-y">
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between px-4 py-3"
						>
							<div className="space-y-1">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-3 w-20" />
							</div>
							<Skeleton className="h-4 w-12" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

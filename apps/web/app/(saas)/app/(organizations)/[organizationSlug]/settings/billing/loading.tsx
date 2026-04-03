import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function OrgBillingSettingsLoading() {
	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<Skeleton className="h-7 w-32" />
				<Skeleton className="h-4 w-56" />
			</div>

			{/* Active plan */}
			<div className="rounded-xl border p-6 space-y-4">
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-4 w-40" />
					</div>
					<Skeleton className="h-8 w-24 rounded-md" />
				</div>
				<Skeleton className="h-px w-full" />
				<div className="grid grid-cols-2 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-4 w-full" />
					))}
				</div>
			</div>

			{/* Transaction history */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-36" />
				<div className="rounded-xl border divide-y">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between px-4 py-3"
						>
							<div className="space-y-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-20" />
							</div>
							<Skeleton className="h-4 w-16" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

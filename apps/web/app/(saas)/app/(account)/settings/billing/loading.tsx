import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function BillingSettingsLoading() {
	return (
		<div className="space-y-8">
			{/* Active plan section */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-32" />
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
			</div>

			{/* Credit packs section */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-28" />
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="rounded-xl border p-5 space-y-3"
						>
							<Skeleton className="h-5 w-20" />
							<Skeleton className="h-8 w-24" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-9 w-full rounded-md" />
						</div>
					))}
				</div>
			</div>

			{/* Transaction history */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-36" />
				<div className="rounded-xl border divide-y">
					{Array.from({ length: 5 }).map((_, i) => (
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

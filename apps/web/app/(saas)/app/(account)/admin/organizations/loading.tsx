import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function AdminOrganizationsLoading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-4 w-56" />
				</div>
				<Skeleton className="h-9 w-32 rounded-md" />
			</div>

			{/* Table */}
			<div className="rounded-xl border divide-y">
				{/* Header */}
				<div className="flex gap-4 px-4 py-3">
					{[120, 80, 100, 80].map((w, i) => (
						<Skeleton
							key={i}
							className={`h-4 w-${w}`}
							style={{ width: w }}
						/>
					))}
				</div>
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="flex items-center gap-4 px-4 py-4">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-16" />
					</div>
				))}
			</div>
		</div>
	);
}

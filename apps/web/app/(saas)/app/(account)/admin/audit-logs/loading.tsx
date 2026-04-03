import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function AdminAuditLogsLoading() {
	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<Skeleton className="h-7 w-28" />
				<Skeleton className="h-4 w-52" />
			</div>

			{/* Filters */}
			<div className="flex gap-3">
				<Skeleton className="h-9 w-36 rounded-md" />
				<Skeleton className="h-9 w-28 rounded-md" />
			</div>

			{/* Table */}
			<div className="rounded-xl border divide-y">
				{Array.from({ length: 10 }).map((_, i) => (
					<div key={i} className="flex items-center gap-4 px-4 py-4">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-24" />
					</div>
				))}
			</div>
		</div>
	);
}

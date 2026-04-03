import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function AdminUsersLoading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<Skeleton className="h-7 w-28" />
					<Skeleton className="h-4 w-44" />
				</div>
			</div>

			{/* Table */}
			<div className="rounded-xl border divide-y">
				<div className="flex gap-4 px-4 py-3">
					{[140, 100, 80, 80].map((w, i) => (
						<Skeleton
							key={i}
							className="h-4"
							style={{ width: w }}
						/>
					))}
				</div>
				{Array.from({ length: 10 }).map((_, i) => (
					<div key={i} className="flex items-center gap-4 px-4 py-4">
						<div className="flex items-center gap-2">
							<Skeleton className="size-7 rounded-full" />
							<Skeleton className="h-4 w-28" />
						</div>
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-20" />
					</div>
				))}
			</div>
		</div>
	);
}

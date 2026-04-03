import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function OrganizationFilesLoading() {
	return (
		<div className="space-y-6">
			{/* Page header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-4 w-56" />
			</div>

			{/* Toolbar */}
			<div className="flex items-center justify-between gap-4">
				<Skeleton className="h-9 w-64 rounded-md" />
				<Skeleton className="h-9 w-28 rounded-md" />
			</div>

			{/* File list */}
			<div className="rounded-xl border divide-y">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center justify-between px-4 py-3"
					>
						<div className="flex items-center gap-3">
							<Skeleton className="h-8 w-8 rounded" />
							<div className="space-y-1">
								<Skeleton className="h-4 w-40" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
						<Skeleton className="h-4 w-16" />
					</div>
				))}
			</div>
		</div>
	);
}

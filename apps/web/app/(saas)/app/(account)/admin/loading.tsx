import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function AdminLoading() {
	return (
		<div>
			{/* Page header skeleton */}
			<div className="flex items-center justify-between mb-6">
				<div className="space-y-2">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>

			{/* Stats cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-lg border p-4 space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-16" />
					</div>
				))}
			</div>

			{/* Table skeleton */}
			<div className="rounded-md border">
				<div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-48 ml-4" />
					<Skeleton className="h-4 w-24 ml-auto" />
					<Skeleton className="h-4 w-20" />
				</div>
				{Array.from({ length: 10 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center gap-4 px-4 py-3 border-b last:border-0"
					>
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-48 ml-4" />
						<Skeleton className="h-4 w-20 ml-auto" />
						<Skeleton className="h-6 w-16 rounded-full" />
					</div>
				))}
			</div>
		</div>
	);
}

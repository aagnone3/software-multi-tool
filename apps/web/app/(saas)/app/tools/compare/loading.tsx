import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function ToolCompareLoading() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-72" />
			</div>

			{/* Tool selectors */}
			<div className="grid grid-cols-2 gap-4">
				<Skeleton className="h-10 w-full rounded-md" />
				<Skeleton className="h-10 w-full rounded-md" />
			</div>

			{/* Comparison area */}
			<div className="grid grid-cols-2 gap-4">
				<div className="rounded-lg border p-4 space-y-4">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-40 w-full rounded-md" />
					<Skeleton className="h-10 w-full rounded-md" />
				</div>
				<div className="rounded-lg border p-4 space-y-4">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-40 w-full rounded-md" />
					<Skeleton className="h-10 w-full rounded-md" />
				</div>
			</div>
		</div>
	);
}

import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function NewsAnalyzerLoading() {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			{/* Main tool area */}
			<div className="lg:col-span-2 space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-72" />
				</div>
				<Skeleton className="h-10 w-full rounded-md" />
				<Skeleton className="h-32 w-full rounded-md" />
				<Skeleton className="h-10 w-32 rounded-md" />
			</div>
			{/* Sidebar */}
			<div className="space-y-4">
				<Skeleton className="h-32 w-full rounded-xl" />
				<Skeleton className="h-48 w-full rounded-xl" />
			</div>
		</div>
	);
}

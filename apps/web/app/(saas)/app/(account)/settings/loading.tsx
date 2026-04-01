import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function SettingsLoading() {
	return (
		<div className="flex flex-col gap-6">
			{/* Page header skeleton */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-4 w-64" />
			</div>

			{/* Settings layout: sidebar + content */}
			<div className="flex gap-6">
				{/* Sidebar skeleton */}
				<div className="w-48 shrink-0 space-y-2">
					<Skeleton className="h-5 w-24 mb-3" />
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-8 w-full rounded-md" />
					))}
				</div>

				{/* Content skeleton */}
				<div className="flex-1 space-y-4">
					<Skeleton className="h-32 w-full rounded-lg" />
					<Skeleton className="h-24 w-full rounded-lg" />
					<Skeleton className="h-24 w-full rounded-lg" />
				</div>
			</div>
		</div>
	);
}

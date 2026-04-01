import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function ToolSlugLoading() {
	return (
		<div className="space-y-6">
			{/* Tool page header skeleton */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-96" />
			</div>

			{/* Tips banner skeleton */}
			<Skeleton className="h-12 w-full rounded-lg" />

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main tool area skeleton */}
				<div className="lg:col-span-2 space-y-4">
					{/* Input area */}
					<div className="rounded-lg border p-6 space-y-4">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-32 w-full rounded-md" />
						<div className="flex justify-end">
							<Skeleton className="h-9 w-28 rounded-md" />
						</div>
					</div>

					{/* Recent runs */}
					<div className="rounded-lg border p-6 space-y-3">
						<Skeleton className="h-5 w-24" />
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="flex items-center justify-between py-2"
							>
								<Skeleton className="h-4 w-48" />
								<Skeleton className="h-4 w-20" />
							</div>
						))}
					</div>
				</div>

				{/* Sidebar skeleton */}
				<div className="space-y-4">
					{/* Stats widget */}
					<div className="rounded-lg border p-4 space-y-3">
						<Skeleton className="h-5 w-20" />
						<div className="grid grid-cols-2 gap-2">
							<Skeleton className="h-12 rounded-md" />
							<Skeleton className="h-12 rounded-md" />
						</div>
					</div>

					{/* Related tools */}
					<div className="rounded-lg border p-4 space-y-3">
						<Skeleton className="h-5 w-28" />
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex items-center gap-2">
								<Skeleton className="h-6 w-6 rounded" />
								<Skeleton className="h-4 w-32" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

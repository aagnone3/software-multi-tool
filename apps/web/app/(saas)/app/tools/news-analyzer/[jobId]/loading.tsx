import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function NewsAnalyzerDetailLoading() {
	return (
		<div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
			{/* Breadcrumb */}
			<div className="flex items-center gap-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-32" />
			</div>

			{/* Title */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-48" />
			</div>

			{/* Main content */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Main result */}
				<div className="md:col-span-2 space-y-4">
					<div className="rounded-xl border p-5 space-y-3">
						<Skeleton className="h-5 w-32" />
						{Array.from({ length: 8 }).map((_, i) => (
							<Skeleton
								key={i}
								className={`h-4 ${i % 4 === 3 ? "w-3/4" : "w-full"}`}
							/>
						))}
					</div>
				</div>

				{/* Sidebar */}
				<div className="space-y-4">
					<div className="rounded-xl border p-4 space-y-3">
						<Skeleton className="h-5 w-24" />
						<div className="space-y-2">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={i} className="h-4 w-full" />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

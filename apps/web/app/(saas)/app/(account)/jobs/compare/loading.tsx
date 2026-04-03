import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function JobCompareLoading() {
	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-96" />
			</div>

			{/* Job selectors */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-10 w-full rounded-md" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-10 w-full rounded-md" />
				</div>
			</div>

			{/* Compare panels */}
			<div className="grid grid-cols-2 gap-4">
				{Array.from({ length: 2 }).map((_, i) => (
					<div
						key={i}
						className="rounded-xl border p-5 space-y-4 min-h-64"
					>
						<Skeleton className="h-5 w-32" />
						<div className="space-y-2">
							{Array.from({ length: 6 }).map((_, j) => (
								<Skeleton
									key={j}
									className={`h-4 ${j % 3 === 2 ? "w-3/4" : "w-full"}`}
								/>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function ChoosePlanLoading() {
	return (
		<div className="flex flex-col items-center gap-8 py-12 px-4">
			{/* Header */}
			<div className="space-y-2 text-center">
				<Skeleton className="h-9 w-64 mx-auto" />
				<Skeleton className="h-5 w-96 mx-auto" />
			</div>

			{/* Plan cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl border p-6 space-y-4">
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-10 w-32" />
						<Skeleton className="h-4 w-full" />
						<div className="space-y-2 pt-2">
							{Array.from({ length: 5 }).map((_, j) => (
								<Skeleton key={j} className="h-4 w-full" />
							))}
						</div>
						<Skeleton className="h-10 w-full rounded-md mt-4" />
					</div>
				))}
			</div>
		</div>
	);
}

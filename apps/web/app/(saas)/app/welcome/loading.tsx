import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function WelcomeLoading() {
	return (
		<div className="flex flex-col items-center gap-8 py-12 px-4 max-w-3xl mx-auto">
			{/* Header */}
			<div className="space-y-2 text-center">
				<Skeleton className="h-10 w-72 mx-auto" />
				<Skeleton className="h-5 w-96 mx-auto" />
			</div>

			{/* Feature cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl border p-5 space-y-3">
						<Skeleton className="size-9 rounded-lg" />
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</div>
				))}
			</div>

			{/* Next steps */}
			<div className="w-full space-y-4">
				<Skeleton className="h-6 w-32" />
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="flex items-center gap-3">
						<Skeleton className="size-8 rounded-full" />
						<div className="flex-1 space-y-1">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-3 w-64" />
						</div>
					</div>
				))}
			</div>

			{/* CTA */}
			<Skeleton className="h-11 w-48 rounded-md" />
		</div>
	);
}

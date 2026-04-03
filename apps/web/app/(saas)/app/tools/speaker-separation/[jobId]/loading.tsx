import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function SpeakerSeparationDetailLoading() {
	return (
		<div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
			{/* Breadcrumb */}
			<div className="flex items-center gap-2">
				<Skeleton className="h-4 w-28" />
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-36" />
			</div>

			{/* Title */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-52" />
			</div>

			{/* Speaker segments */}
			<div className="rounded-xl border p-5 space-y-4">
				<Skeleton className="h-5 w-40" />
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="flex items-start gap-3">
						<Skeleton className="size-8 rounded-full shrink-0" />
						<div className="flex-1 space-y-2">
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-3 w-16" />
							</div>
							<Skeleton
								className={`h-4 ${i % 3 === 2 ? "w-3/4" : "w-full"}`}
							/>
						</div>
					</div>
				))}
			</div>

			{/* Export / actions */}
			<div className="flex items-center gap-3">
				<Skeleton className="h-9 w-32 rounded-md" />
				<Skeleton className="h-9 w-24 rounded-md" />
			</div>
		</div>
	);
}

import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function ChatbotLoading() {
	return (
		<div className="flex h-full gap-4">
			{/* Sidebar skeleton */}
			<div className="w-64 shrink-0 space-y-3">
				<div className="flex items-center justify-between mb-4">
					<Skeleton className="h-6 w-20" />
					<Skeleton className="h-8 w-8 rounded-md" />
				</div>
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-10 w-full rounded-md" />
				))}
			</div>

			{/* Chat area skeleton */}
			<div className="flex-1 flex flex-col gap-4">
				{/* Messages skeleton */}
				<div className="flex-1 space-y-4 py-4">
					<div className="flex gap-3">
						<Skeleton className="h-8 w-8 rounded-full shrink-0" />
						<div className="space-y-2 flex-1">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					</div>
					<div className="flex gap-3 flex-row-reverse">
						<Skeleton className="h-8 w-8 rounded-full shrink-0" />
						<div className="space-y-2 flex-1 items-end flex flex-col">
							<Skeleton className="h-4 w-2/3" />
							<Skeleton className="h-4 w-1/3" />
						</div>
					</div>
					<div className="flex gap-3">
						<Skeleton className="h-8 w-8 rounded-full shrink-0" />
						<div className="space-y-2 flex-1">
							<Skeleton className="h-4 w-5/6" />
							<Skeleton className="h-4 w-2/3" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					</div>
				</div>

				{/* Input skeleton */}
				<Skeleton className="h-14 w-full rounded-lg" />
			</div>
		</div>
	);
}

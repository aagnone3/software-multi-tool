import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function JobDetailLoading() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Skeleton className="size-10 rounded-lg shrink-0" />
				<div className="space-y-2">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-32" />
				</div>
				<div className="ml-auto flex items-center gap-2">
					<Skeleton className="h-5 w-20 rounded-full" />
					<Skeleton className="h-9 w-24" />
				</div>
			</div>

			{/* Main content + sidebar */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					{/* Input section */}
					<div className="rounded-lg border p-4 space-y-3">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-32 w-full" />
					</div>
					{/* Output section */}
					<div className="rounded-lg border p-4 space-y-3">
						<Skeleton className="h-5 w-28" />
						<Skeleton className="h-48 w-full" />
					</div>
				</div>
				<div className="space-y-4">
					<div className="rounded-lg border p-4 space-y-3">
						<Skeleton className="h-5 w-20" />
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="flex justify-between">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-20" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

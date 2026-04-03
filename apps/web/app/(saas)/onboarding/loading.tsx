import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function OnboardingLoading() {
	return (
		<div className="flex flex-col items-center gap-8 py-16 px-4 max-w-lg mx-auto">
			{/* Progress steps */}
			<div className="flex items-center gap-2 w-full">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="flex items-center gap-2 flex-1">
						<Skeleton className="h-8 w-8 rounded-full shrink-0" />
						{i < 2 && <Skeleton className="h-1 flex-1" />}
					</div>
				))}
			</div>

			{/* Step content */}
			<div className="w-full space-y-6">
				<div className="space-y-2">
					<Skeleton className="h-7 w-64" />
					<Skeleton className="h-4 w-full" />
				</div>
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-14 w-full rounded-lg" />
					))}
				</div>
				<Skeleton className="h-11 w-full rounded-md" />
			</div>
		</div>
	);
}

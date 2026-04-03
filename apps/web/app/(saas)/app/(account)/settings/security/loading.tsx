import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function SecuritySettingsLoading() {
	return (
		<div className="space-y-8">
			{/* Password section */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-32" />
				<div className="space-y-3">
					{Array.from({ length: 2 }).map((_, i) => (
						<div key={i} className="space-y-1">
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-10 w-full rounded-md" />
						</div>
					))}
					<Skeleton className="h-9 w-32 rounded-md" />
				</div>
			</div>

			{/* Two-factor section */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-36" />
				<div className="rounded-xl border p-5 space-y-3">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<Skeleton className="h-5 w-28" />
							<Skeleton className="h-4 w-56" />
						</div>
						<Skeleton className="h-9 w-24 rounded-md" />
					</div>
				</div>
			</div>

			{/* Passkeys section */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-24" />
				<div className="space-y-2">
					{Array.from({ length: 2 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between rounded-xl border p-4"
						>
							<div className="space-y-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>
							<Skeleton className="h-8 w-20 rounded-md" />
						</div>
					))}
				</div>
				<Skeleton className="h-9 w-28 rounded-md" />
			</div>
		</div>
	);
}

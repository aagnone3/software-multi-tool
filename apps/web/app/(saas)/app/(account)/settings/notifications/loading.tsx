import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function NotificationsSettingsLoading() {
	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<Skeleton className="h-6 w-40" />
				<div className="rounded-xl border divide-y">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between px-5 py-4"
						>
							<div className="space-y-1">
								<Skeleton className="h-4 w-40" />
								<Skeleton className="h-3 w-56" />
							</div>
							<Skeleton className="h-6 w-10 rounded-full" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

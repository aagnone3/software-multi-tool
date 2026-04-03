import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function OrgMembersSettingsLoading() {
	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-7 w-32" />
					<Skeleton className="h-4 w-52" />
				</div>
				<Skeleton className="h-9 w-28 rounded-md" />
			</div>

			{/* Members list */}
			<div className="rounded-xl border divide-y">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center justify-between px-4 py-3"
					>
						<div className="flex items-center gap-3">
							<Skeleton className="h-9 w-9 rounded-full" />
							<div className="space-y-1">
								<Skeleton className="h-4 w-36" />
								<Skeleton className="h-3 w-28" />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Skeleton className="h-6 w-16 rounded-full" />
							<Skeleton className="h-8 w-8 rounded" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

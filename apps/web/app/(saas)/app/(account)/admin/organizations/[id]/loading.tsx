import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function AdminOrganizationDetailLoading() {
	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Breadcrumb */}
			<div className="flex items-center gap-2">
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-28" />
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-32" />
			</div>

			{/* Org header */}
			<div className="flex items-center gap-4">
				<Skeleton className="size-12 rounded-lg" />
				<div className="space-y-1">
					<Skeleton className="h-7 w-48" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>

			{/* Stats row */}
			<div className="grid grid-cols-3 gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl border p-4 space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-16" />
					</div>
				))}
			</div>

			{/* Members table */}
			<div className="rounded-xl border p-4 space-y-3">
				<Skeleton className="h-5 w-24" />
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="flex items-center gap-3 py-2">
						<Skeleton className="size-8 rounded-full" />
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-4 w-24 ml-auto" />
					</div>
				))}
			</div>
		</div>
	);
}

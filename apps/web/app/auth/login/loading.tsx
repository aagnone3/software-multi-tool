import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function LoginLoading() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-sm space-y-6 px-4">
				{/* Logo/header */}
				<div className="space-y-2 text-center">
					<Skeleton className="mx-auto h-8 w-8 rounded-full" />
					<Skeleton className="mx-auto h-7 w-40" />
					<Skeleton className="mx-auto h-4 w-56" />
				</div>

				{/* Social sign-in buttons */}
				<div className="space-y-2">
					<Skeleton className="h-10 w-full rounded-md" />
					<Skeleton className="h-10 w-full rounded-md" />
				</div>

				{/* Divider */}
				<div className="flex items-center gap-2">
					<Skeleton className="h-px flex-1" />
					<Skeleton className="h-4 w-8" />
					<Skeleton className="h-px flex-1" />
				</div>

				{/* Email input */}
				<div className="space-y-2">
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-10 w-full rounded-md" />
				</div>

				{/* Password input */}
				<div className="space-y-2">
					<div className="flex justify-between">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-28" />
					</div>
					<Skeleton className="h-10 w-full rounded-md" />
				</div>

				{/* Submit button */}
				<Skeleton className="h-10 w-full rounded-md" />

				{/* Sign-up link */}
				<Skeleton className="mx-auto h-4 w-48" />
			</div>
		</div>
	);
}

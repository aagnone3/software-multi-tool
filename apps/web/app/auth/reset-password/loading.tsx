import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function ResetPasswordLoading() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-sm space-y-6 px-4">
				{/* Header */}
				<div className="space-y-2 text-center">
					<Skeleton className="mx-auto h-7 w-40" />
					<Skeleton className="mx-auto h-4 w-60" />
				</div>

				{/* New password input */}
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-10 w-full rounded-md" />
				</div>

				{/* Confirm password input */}
				<div className="space-y-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-10 w-full rounded-md" />
				</div>

				{/* Submit button */}
				<Skeleton className="h-10 w-full rounded-md" />
			</div>
		</div>
	);
}

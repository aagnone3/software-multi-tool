import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function ForgotPasswordLoading() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-sm space-y-6 px-4">
				{/* Header */}
				<div className="space-y-2 text-center">
					<Skeleton className="mx-auto h-7 w-44" />
					<Skeleton className="mx-auto h-4 w-64" />
				</div>

				{/* Email input */}
				<div className="space-y-2">
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-10 w-full rounded-md" />
				</div>

				{/* Submit button */}
				<Skeleton className="h-10 w-full rounded-md" />

				{/* Back to login link */}
				<Skeleton className="mx-auto h-4 w-32" />
			</div>
		</div>
	);
}

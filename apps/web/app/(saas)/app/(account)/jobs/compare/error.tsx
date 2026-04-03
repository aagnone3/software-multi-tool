"use client";

import { Button } from "@ui/components/button";
import React, { useEffect } from "react";

interface JobCompareErrorBoundaryProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function JobCompareErrorBoundary({
	error,
	reset,
}: JobCompareErrorBoundaryProps) {
	useEffect(() => {
		console.error("Job compare page error:", error);
	}, [error]);

	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8 text-center">
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-semibold text-foreground">
					Something went wrong
				</h2>
				<p className="max-w-md text-sm text-muted-foreground">
					We ran into an unexpected error loading the job comparison
					view. Please try again or go back to jobs.
				</p>
			</div>
			<div className="flex gap-3">
				<Button variant="outline" onClick={reset}>
					Try again
				</Button>
				<Button variant="primary" asChild>
					<a href="/app/jobs">Back to jobs</a>
				</Button>
			</div>
		</div>
	);
}

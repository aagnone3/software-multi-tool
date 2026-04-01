"use client";

import { Button } from "@ui/components/button";
import React, { useEffect } from "react";

interface ToolHistoryErrorBoundaryProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function ToolHistoryErrorBoundary({
	error,
	reset,
}: ToolHistoryErrorBoundaryProps) {
	useEffect(() => {
		console.error("Tool history page error:", error);
	}, [error]);

	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8 text-center">
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-semibold text-foreground">
					Could not load run history
				</h2>
				<p className="max-w-md text-sm text-muted-foreground">
					We ran into an unexpected error loading your run history.
					Your data is safe — try refreshing or go back to the tool.
				</p>
			</div>
			<div className="flex gap-3">
				<Button variant="outline" onClick={reset}>
					Try again
				</Button>
				<Button variant="primary" asChild>
					<a href="/app/tools">Back to tools</a>
				</Button>
			</div>
		</div>
	);
}

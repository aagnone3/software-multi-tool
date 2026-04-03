"use client";

import { Button } from "@ui/components/button";
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function OrganizationInvitationError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center gap-4">
			<AlertCircleIcon className="size-12 text-muted-foreground" />
			<div className="space-y-1">
				<h2 className="text-xl font-semibold">
					Invitation page failed to load
				</h2>
				<p className="text-muted-foreground text-sm">
					Something went wrong while loading your organization
					invitation. Please try again or contact the person who
					invited you.
				</p>
			</div>
			<div className="flex items-center gap-3">
				<Button onClick={reset} variant="primary">
					Try again
				</Button>
				<Button asChild variant="outline">
					<Link href="/app">Go to dashboard</Link>
				</Button>
			</div>
		</div>
	);
}

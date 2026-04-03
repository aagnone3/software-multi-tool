import { Skeleton } from "@ui/components/skeleton";
import React from "react";

export default function OrganizationChatbotLoading() {
	return (
		<div className="flex h-full flex-col gap-4">
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-36" />
				<Skeleton className="h-4 w-52" />
			</div>

			{/* Chat area */}
			<div className="flex-1 rounded-xl border p-4 space-y-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className={`flex gap-3 ${i % 2 === 1 ? "justify-end" : ""}`}
					>
						{i % 2 === 0 && (
							<Skeleton className="h-8 w-8 rounded-full shrink-0" />
						)}
						<Skeleton
							className={`h-12 rounded-lg ${i % 2 === 0 ? "w-3/4" : "w-1/2"}`}
						/>
					</div>
				))}
			</div>

			{/* Input bar */}
			<div className="flex gap-2">
				<Skeleton className="h-11 flex-1 rounded-md" />
				<Skeleton className="h-11 w-11 rounded-md" />
			</div>
		</div>
	);
}

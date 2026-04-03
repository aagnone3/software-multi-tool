"use client";

import { ShieldCheckIcon, StarIcon, UsersIcon } from "lucide-react";
import React from "react";

export function PricingTrustBar({ className }: { className?: string }) {
	return (
		<div
			className={`flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8 mt-8 text-foreground/60 text-sm ${className ?? ""}`}
		>
			<div className="flex items-center gap-2">
				<UsersIcon className="size-4 text-primary shrink-0" />
				<span>
					<strong className="text-foreground">500+</strong> teams
					using the starter
				</span>
			</div>
			<div className="flex items-center gap-2">
				<div className="flex gap-0.5">
					{[1, 2, 3, 4, 5].map((i) => (
						<StarIcon
							key={i}
							className="size-3.5 fill-amber-400 text-amber-400"
						/>
					))}
				</div>
				<span>
					<strong className="text-foreground">4.9/5</strong> average
					rating
				</span>
			</div>
			<div className="flex items-center gap-2">
				<ShieldCheckIcon className="size-4 text-emerald-500 shrink-0" />
				<span>
					<strong className="text-foreground">30-day</strong>{" "}
					money-back guarantee
				</span>
			</div>
		</div>
	);
}

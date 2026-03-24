import {
	ClockIcon,
	ShieldCheckIcon,
	StarIcon,
	UsersIcon,
	ZapIcon,
} from "lucide-react";
import React from "react";

interface StatItem {
	id: string;
	icon: typeof UsersIcon;
	value: string;
	label: string;
}

const stats: StatItem[] = [
	{
		id: "users",
		icon: UsersIcon,
		value: "500+",
		label: "Businesses using it",
	},
	{
		id: "time-saved",
		icon: ClockIcon,
		value: "10+ hrs",
		label: "Saved per user/month",
	},
	{
		id: "rating",
		icon: StarIcon,
		value: "4.9 / 5",
		label: "Average rating",
	},
	{
		id: "speed",
		icon: ZapIcon,
		value: "< 60s",
		label: "Average processing time",
	},
	{
		id: "security",
		icon: ShieldCheckIcon,
		value: "SOC 2",
		label: "Security compliant",
	},
];

export function SocialProofBar() {
	return (
		<section className="border-y border-border/50 bg-muted/30 py-8">
			<div className="container max-w-5xl">
				<div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
					{stats.map((stat) => (
						<div
							key={stat.id}
							className="flex flex-col items-center gap-1 text-center"
						>
							<div className="flex items-center gap-2">
								<stat.icon className="size-4 text-primary" />
								<span className="font-bold text-lg text-foreground">
									{stat.value}
								</span>
							</div>
							<span className="text-foreground/50 text-xs">
								{stat.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

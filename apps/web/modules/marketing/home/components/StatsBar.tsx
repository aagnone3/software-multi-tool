import React from "react";

interface Stat {
	label: string;
	value: string;
	description: string;
}

const stats: Stat[] = [
	{
		label: "Hours Saved",
		value: "50,000+",
		description: "Estimated hours saved by users each month",
	},
	{
		label: "Documents Processed",
		value: "200,000+",
		description: "Invoices, contracts, and reports analyzed",
	},
	{
		label: "Time Reduction",
		value: "80%",
		description: "Average reduction in manual processing time",
	},
	{
		label: "Accuracy Rate",
		value: "98.5%",
		description: "AI extraction accuracy on structured documents",
	},
];

export function StatsBar() {
	return (
		<section className="border-y bg-muted/30 py-12">
			<div className="container">
				<div className="grid grid-cols-2 gap-6 md:grid-cols-4">
					{stats.map((stat) => (
						<div key={stat.label} className="text-center">
							<div className="font-bold text-3xl text-primary md:text-4xl">
								{stat.value}
							</div>
							<div className="mt-1 font-semibold text-foreground text-sm">
								{stat.label}
							</div>
							<div className="mt-1 text-muted-foreground text-xs">
								{stat.description}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

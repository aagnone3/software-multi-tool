"use client";

import { cn } from "@ui/lib";
import {
	BarChart3Icon,
	BriefcaseIcon,
	BuildingIcon,
	FileSearchIcon,
	HeadphonesIcon,
	ScaleIcon,
	StoreIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";

interface Persona {
	id: string;
	icon: typeof BriefcaseIcon;
	role: string;
	problem: string;
	solution: string;
	toolHref: string;
	toolName: string;
}

const personas: Persona[] = [
	{
		id: "freelancer",
		icon: BriefcaseIcon,
		role: "Freelancer",
		problem: "Hours spent writing meeting recap emails",
		solution: "Summarize client calls in 30 seconds",
		toolHref: "/app/tools/meeting-summarizer",
		toolName: "Meeting Summarizer",
	},
	{
		id: "small-business",
		icon: StoreIcon,
		role: "Small Business Owner",
		problem: "Manual invoice data entry eating into your day",
		solution: "Extract invoice data automatically",
		toolHref: "/app/tools/invoice-processor",
		toolName: "Invoice Processor",
	},
	{
		id: "operations",
		icon: BuildingIcon,
		role: "Operations Manager",
		problem: "Reviewing vendor contracts without a legal team",
		solution: "Surface risk clauses and key terms instantly",
		toolHref: "/app/tools/contract-analyzer",
		toolName: "Contract Analyzer",
	},
	{
		id: "finance",
		icon: BarChart3Icon,
		role: "Finance Team",
		problem: "Categorizing hundreds of expenses each month",
		solution: "Bulk-categorize expenses from any spreadsheet",
		toolHref: "/app/tools/expense-categorizer",
		toolName: "Expense Categorizer",
	},
	{
		id: "support",
		icon: HeadphonesIcon,
		role: "Customer Success",
		problem: "Drowning in NPS surveys and support tickets",
		solution: "Spot trends across hundreds of responses",
		toolHref: "/app/tools/feedback-analyzer",
		toolName: "Feedback Analyzer",
	},
	{
		id: "legal",
		icon: ScaleIcon,
		role: "Legal / Compliance",
		problem: "Manually reviewing every incoming contract",
		solution: "Flag unusual clauses before they become problems",
		toolHref: "/app/tools/contract-analyzer",
		toolName: "Contract Analyzer",
	},
	{
		id: "hr",
		icon: UsersIcon,
		role: "HR / Recruiting",
		problem: "Transcribing interview recordings by hand",
		solution: "Diarized transcripts with speaker labels",
		toolHref: "/app/tools/speaker-separation",
		toolName: "Speaker Separation",
	},
	{
		id: "analyst",
		icon: FileSearchIcon,
		role: "Research Analyst",
		problem: "Keeping up with hundreds of news sources daily",
		solution: "Analyze bias, sentiment, and key themes",
		toolHref: "/app/tools/news-analyzer",
		toolName: "News Analyzer",
	},
];

export function WhoIsItFor({ className }: { className?: string }) {
	return (
		<section
			id="who-is-it-for"
			className={cn("scroll-mt-16 py-16 lg:py-24", className)}
		>
			<div className="container max-w-6xl">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="font-bold text-3xl md:text-4xl lg:text-5xl">
						Built for busy professionals
					</h2>
					<p className="mt-4 text-balance text-foreground/70 text-lg">
						Whether you're solo or running a team, there's a tool
						that saves you hours every week.
					</p>
				</div>

				<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
					{personas.map((persona) => (
						<div
							key={persona.id}
							className="group rounded-2xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
						>
							<div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
								<persona.icon className="size-5" />
							</div>
							<p className="font-semibold text-sm text-foreground">
								{persona.role}
							</p>
							<p className="mt-1 text-foreground/50 text-xs line-through">
								{persona.problem}
							</p>
							<p className="mt-1 font-medium text-primary text-xs">
								→ {persona.solution}
							</p>
							<Link
								href={persona.toolHref}
								className="mt-3 inline-block text-foreground/50 text-xs hover:text-primary hover:underline"
							>
								Try {persona.toolName} →
							</Link>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

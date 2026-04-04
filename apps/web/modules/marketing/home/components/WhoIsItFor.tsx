"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
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
import React, { useCallback } from "react";

interface Persona {
	id: string;
	icon: typeof BriefcaseIcon;
	role: string;
	problem: string;
	solution: string;
	toolSlug: string;
	toolName: string;
}

const personas: Persona[] = [
	{
		id: "freelancer",
		icon: BriefcaseIcon,
		role: "Freelancer",
		problem: "Hours spent writing meeting recap emails",
		solution: "Summarize client calls in 30 seconds",
		toolSlug: "meeting-summarizer",
		toolName: "Meeting Summarizer",
	},
	{
		id: "small-business",
		icon: StoreIcon,
		role: "Small Business Owner",
		problem: "Manual invoice data entry eating into your day",
		solution: "Extract invoice data automatically",
		toolSlug: "invoice-processor",
		toolName: "Invoice Processor",
	},
	{
		id: "operations",
		icon: BuildingIcon,
		role: "Operations Manager",
		problem: "Reviewing vendor contracts without a legal team",
		solution: "Surface risk clauses and key terms instantly",
		toolSlug: "contract-analyzer",
		toolName: "Contract Analyzer",
	},
	{
		id: "finance",
		icon: BarChart3Icon,
		role: "Finance Team",
		problem: "Categorizing hundreds of expenses each month",
		solution: "Bulk-categorize expenses from any spreadsheet",
		toolSlug: "expense-categorizer",
		toolName: "Expense Categorizer",
	},
	{
		id: "support",
		icon: HeadphonesIcon,
		role: "Customer Success",
		problem: "Drowning in NPS surveys and support tickets",
		solution: "Spot trends across hundreds of responses",
		toolSlug: "feedback-analyzer",
		toolName: "Feedback Analyzer",
	},
	{
		id: "legal",
		icon: ScaleIcon,
		role: "Legal / Compliance",
		problem: "Manually reviewing every incoming contract",
		solution: "Flag unusual clauses before they become problems",
		toolSlug: "contract-analyzer",
		toolName: "Contract Analyzer",
	},
	{
		id: "hr",
		icon: UsersIcon,
		role: "HR / Recruiting",
		problem: "Transcribing interview recordings by hand",
		solution: "Diarized transcripts with speaker labels",
		toolSlug: "speaker-separation",
		toolName: "Speaker Separation",
	},
	{
		id: "analyst",
		icon: FileSearchIcon,
		role: "Research Analyst",
		problem: "Keeping up with hundreds of news sources daily",
		solution: "Analyze bias, sentiment, and key themes",
		toolSlug: "news-analyzer",
		toolName: "News Analyzer",
	},
];

function PersonaCard({ persona }: { persona: Persona }) {
	const { track } = useProductAnalytics();

	const handleClick = useCallback(() => {
		track({
			name: "who_is_it_for_tool_clicked",
			props: {
				persona_id: persona.id,
				tool_slug: persona.toolSlug,
			},
		});
	}, [track, persona.id, persona.toolSlug]);

	return (
		<div className="group rounded-2xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md">
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
				href={`/tools/${persona.toolSlug}`}
				className="mt-3 inline-block text-foreground/50 text-xs hover:text-primary hover:underline"
				onClick={handleClick}
			>
				Try {persona.toolName} →
			</Link>
		</div>
	);
}

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
						<PersonaCard key={persona.id} persona={persona} />
					))}
				</div>
			</div>
		</section>
	);
}

import { CheckIcon, ClockIcon, SparklesIcon } from "lucide-react";
import React from "react";
import { HeroCta } from "./HeroCta";

const highlights = [
	"Summarizes a 1-hour meeting in under 30 seconds",
	"Extracts invoice data from any PDF in seconds",
	"Analyzes a contract for risk clauses instantly",
];

export function Hero() {
	return (
		<section className="relative max-w-full overflow-x-hidden">
			<div className="container relative z-20 pt-32 pb-16 text-center md:pt-40 lg:pt-48 lg:pb-24">
				<div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
					<SparklesIcon className="size-4" />
					<span>AI-powered tools for small businesses</span>
				</div>

				<h1 className="mx-auto max-w-4xl text-balance font-bold text-4xl leading-tight md:text-5xl lg:text-6xl">
					Stop wasting hours on tasks{" "}
					<span className="text-primary">AI can do in seconds</span>
				</h1>

				<p className="mx-auto mt-6 max-w-2xl text-balance text-foreground/70 text-lg md:text-xl">
					Eight powerful AI tools in one platform — built for small
					business owners who need results fast, without a technical
					team.
				</p>

				{/* Social proof ticks */}
				<ul className="mx-auto mt-8 flex max-w-xl flex-col items-start gap-2 text-left text-sm text-foreground/70 sm:gap-3">
					{highlights.map((h) => (
						<li key={h} className="flex items-start gap-2">
							<CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
							<span>{h}</span>
						</li>
					))}
				</ul>

				<HeroCta />

				<p className="mt-5 flex items-center justify-center gap-1.5 text-foreground/50 text-sm">
					<ClockIcon className="size-3.5" />
					Set up in under 2 minutes · Free credits included
				</p>
			</div>
		</section>
	);
}

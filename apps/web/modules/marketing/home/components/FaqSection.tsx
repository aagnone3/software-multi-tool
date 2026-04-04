import { cn } from "@ui/lib";
import React from "react";

export function FaqSection({ className }: { className?: string }) {
	const items = [
		{
			question: "Do you offer a free trial?",
			answer: "Yes — every new account gets 10 free credits to try the tools with no credit card required. You can analyze documents, process audio, and run AI workflows before spending a cent.",
		},
		{
			question: "How does credit-based pricing work?",
			answer: "Each AI tool consumes a small number of credits per run. Credits never expire, so you only pay for what you use. Purchase additional credit packs any time from your account dashboard.",
		},
		{
			question: "What file types are supported?",
			answer: "Most tools accept PDF, DOCX, TXT, CSV, XLSX, MP3, MP4, and WAV files. File size limits and supported MIME types are shown on each tool's page before you upload.",
		},
		{
			question: "Can I use the tools for my whole team?",
			answer: "Yes. Upgrade to a team plan to invite members to a shared organization, pool credits, and manage access from one billing account.",
		},
		{
			question: "How do I cancel my subscription?",
			answer: "Cancel any time from the Billing section in your account settings. Your credits and active plan remain available through the end of the billing period.",
		},
		{
			question: "Is my data kept private?",
			answer: "Files you upload are processed to generate your results and are not used to train AI models. Documents are deleted from our servers after processing completes.",
		},
	];

	if (!items) {
		return null;
	}

	return (
		<section
			className={cn("scroll-mt-20 border-t py-12 lg:py-16", className)}
			id="faq"
		>
			<div className="container max-w-5xl">
				<div className="mb-12 lg:text-center">
					<h1 className="mb-2 font-bold text-4xl lg:text-5xl">
						Frequently asked questions
					</h1>
					<p className="text-lg opacity-50">
						Do you have any questions? We have got you covered.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{items.map((item, i) => (
						<div
							key={`faq-item-${i}`}
							className="rounded-lg bg-card border p-4 lg:p-6"
						>
							<h4 className="mb-2 font-semibold text-lg">
								{item.question}
							</h4>
							<p className="text-foreground/60">{item.answer}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

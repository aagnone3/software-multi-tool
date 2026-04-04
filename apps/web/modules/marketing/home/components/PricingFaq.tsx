"use client";
import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { cn } from "@ui/lib";
import React, { useCallback, useState } from "react";

const PRICING_FAQS = [
	{
		question: "What happens when I run out of credits?",
		answer: "Your tools simply pause — no surprise charges or service interruption. You'll see a clear low-credits warning and can purchase a credit pack from your dashboard in seconds. Credits never expire, so topping up early is always fine.",
	},
	{
		question: "Is there a free plan? Can I try before I buy?",
		answer: "Every new account gets 10 complimentary credits — no credit card required. Use them to process real files and see actual output before committing to anything.",
	},
	{
		question: "Can I switch plans or cancel anytime?",
		answer: "Yes. Upgrade, downgrade, or cancel from Billing in your account settings. No lock-in, no cancellation fees. If you cancel, your remaining credits stay valid through the end of your billing period.",
	},
	{
		question: "Do credits roll over month to month?",
		answer: "Credits you purchase in a one-time pack never expire. Subscription plan credits reset each billing period, but any unused credits from purchases carry forward indefinitely.",
	},
	{
		question: "Is my data safe? Do you train on my files?",
		answer: "Your files are processed only to generate your results. We do not train AI models on customer data, and uploaded files are deleted from our servers after processing completes.",
	},
	{
		question: "Do you offer team or volume pricing?",
		answer: "Yes. Team plans let you pool credits across an organization and manage member access from a single billing account. For high-volume or enterprise needs, contact us for a custom quote.",
	},
];

function FaqItem({
	question,
	answer,
	onToggle,
}: {
	question: string;
	answer: string;
	onToggle: (q: string, open: boolean) => void;
}) {
	const [open, setOpen] = useState(false);

	const handleToggle = useCallback(() => {
		const next = !open;
		setOpen(next);
		onToggle(question, next);
	}, [open, question, onToggle]);

	return (
		<div className="border-b last:border-b-0">
			<button
				type="button"
				className="flex w-full items-center justify-between py-4 text-left font-medium text-base hover:text-primary transition-colors"
				onClick={handleToggle}
				aria-expanded={open}
			>
				<span>{question}</span>
				<span
					className={cn(
						"ml-4 shrink-0 transition-transform duration-200",
						open && "rotate-180",
					)}
					aria-hidden="true"
				>
					▾
				</span>
			</button>
			{open && (
				<p className="pb-4 text-foreground/60 text-sm leading-relaxed">
					{answer}
				</p>
			)}
		</div>
	);
}

export function PricingFaq({ className }: { className?: string }) {
	const { track } = useProductAnalytics();

	const handleToggle = useCallback(
		(question: string, open: boolean) => {
			track({
				name: "pricing_faq_item_toggled",
				props: { question, open },
			});
		},
		[track],
	);

	return (
		<div className={cn("mt-12", className)}>
			<h3 className="mb-6 text-center font-semibold text-xl">
				Pricing questions answered
			</h3>
			<div className="mx-auto max-w-2xl rounded-xl border bg-card px-6 py-2">
				{PRICING_FAQS.map((item) => (
					<FaqItem
						key={item.question}
						{...item}
						onToggle={handleToggle}
					/>
				))}
			</div>
		</div>
	);
}

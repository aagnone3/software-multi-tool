import { Footer } from "@saas/shared/components/Footer";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { Logo } from "@shared/components/Logo";
import { cn } from "@ui/lib";
import {
	CheckIcon,
	ClockIcon,
	ShieldCheckIcon,
	StarIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import React from "react";

const benefits = [
	{
		icon: ZapIcon,
		title: "10 free credits — no card required",
		description: "Start processing documents instantly after signup.",
	},
	{
		icon: ClockIcon,
		title: "Save 10+ hours per month",
		description: "AI handles tasks that used to take your whole afternoon.",
	},
	{
		icon: CheckIcon,
		title: "9 tools in one platform",
		description:
			"Meetings, contracts, invoices, expenses, and more — all covered.",
	},
	{
		icon: ShieldCheckIcon,
		title: "Your data stays private",
		description:
			"Files are deleted after processing. We never train on your data.",
	},
];

const testimonial = {
	quote: "I used to spend half my Friday summarizing meeting notes. Now it's done before I leave the call.",
	author: "Sarah M.",
	role: "Operations Lead, Series B startup",
	rating: 5,
};

export function AuthWrapper({
	children,
	contentClass,
}: PropsWithChildren<{ contentClass?: string }>) {
	return (
		<div className="flex min-h-screen w-full py-6">
			<div className="flex w-full flex-col items-center justify-between gap-8">
				<div className="container">
					<div className="flex items-center justify-between">
						<Link href="/" className="block">
							<Logo />
						</Link>

						<div className="flex items-center justify-end gap-2">
							<ColorModeToggle />
						</div>
					</div>
				</div>

				<div className="container flex justify-center">
					<div className="flex w-full max-w-3xl flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
						{/* Benefits sidebar — only on large screens */}
						<aside className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:gap-6 lg:py-4">
							<p className="font-semibold text-primary text-sm uppercase tracking-wider">
								Why teams love it
							</p>
							<ul className="flex flex-col gap-5">
								{benefits.map((b) => (
									<li
										key={b.title}
										className="flex items-start gap-3"
									>
										<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
											<b.icon className="size-4" />
										</span>
										<div>
											<p className="font-semibold text-sm">
												{b.title}
											</p>
											<p className="text-foreground/60 text-sm">
												{b.description}
											</p>
										</div>
									</li>
								))}
							</ul>

							{/* Testimonial */}
							<blockquote
								data-testid="auth-testimonial"
								className="rounded-2xl border border-border bg-muted/50 p-4"
							>
								<div
									role="img"
									aria-label={`${testimonial.rating} out of 5 stars`}
									className="mb-2 flex gap-0.5"
								>
									{Array.from({
										length: testimonial.rating,
									}).map((_, i) => (
										<StarIcon
											key={i}
											className="size-3.5 fill-yellow-400 text-yellow-400"
										/>
									))}
								</div>
								<p className="mb-3 text-foreground/80 text-sm leading-relaxed">
									&ldquo;{testimonial.quote}&rdquo;
								</p>
								<footer className="flex flex-col">
									<span className="font-semibold text-sm">
										{testimonial.author}
									</span>
									<span className="text-foreground/50 text-xs">
										{testimonial.role}
									</span>
								</footer>
							</blockquote>
						</aside>

						{/* Form card */}
						<main
							className={cn(
								"w-full max-w-md rounded-3xl bg-card p-6 border lg:p-8",
								contentClass,
							)}
						>
							{children}
						</main>
					</div>
				</div>

				<Footer />
			</div>
		</div>
	);
}

import { ArrowRightIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface Testimonial {
	id: string;
	name: string;
	role: string;
	company: string;
	content: string;
	rating: number;
	avatar: string;
}

interface Testimonial {
	id: string;
	name: string;
	role: string;
	company: string;
	content: string;
	rating: number;
	avatar: string;
	highlight: string;
}

const testimonials: Testimonial[] = [
	{
		id: "1",
		name: "Sarah Chen",
		role: "Operations Manager",
		company: "Bright Path Consulting",
		content:
			"The meeting summarizer has transformed how we handle client calls. What used to take 2 hours of manual notes now takes 5 minutes. Our team is more productive and nothing falls through the cracks.",
		rating: 5,
		avatar: "SC",
		highlight: "Saved 2+ hours per meeting",
	},
	{
		id: "2",
		name: "Marcus Rivera",
		role: "Freelance Accountant",
		company: "Self-employed",
		content:
			"Invoice processing used to be my biggest time sink every month. Now I just upload the PDFs and the AI extracts everything accurately. I've reclaimed nearly 10 hours per month.",
		rating: 5,
		avatar: "MR",
		highlight: "10 hours saved per month",
	},
	{
		id: "3",
		name: "Priya Nair",
		role: "Customer Success Lead",
		company: "Launchpoint SaaS",
		content:
			"The feedback analyzer lets us process hundreds of support tickets and reviews in minutes. We spotted a recurring pain point we'd missed for months — and fixed it. Response rates jumped 23%.",
		rating: 5,
		avatar: "PN",
		highlight: "23% improvement in response rates",
	},
	{
		id: "4",
		name: "James Whitfield",
		role: "Podcast Producer",
		company: "Clear Signal Media",
		content:
			"Speaker separation is incredibly accurate. I run raw interview recordings through it and get clean, labeled transcripts in minutes. My editing workflow has never been smoother.",
		rating: 5,
		avatar: "JW",
		highlight: "Clean transcripts in minutes",
	},
	{
		id: "5",
		name: "Amanda Torres",
		role: "Small Business Owner",
		company: "Roots Bakery Co.",
		content:
			"I'm not a tech person, but this platform is genuinely easy to use. The expense categorizer saves me a weekend every quarter and I actually understand my spending now.",
		rating: 5,
		avatar: "AT",
		highlight: "A full weekend saved every quarter",
	},
	{
		id: "6",
		name: "David Kim",
		role: "Legal Assistant",
		company: "Harmon & Associates",
		content:
			"Contract analysis used to require senior attorney time just for initial review. Now I run contracts through the AI first to flag key clauses. It's become an essential part of our intake process.",
		rating: 5,
		avatar: "DK",
		highlight: "Senior review time eliminated",
	},
];

function StarRating({ rating }: { rating: number }) {
	return (
		<div
			className="flex gap-0.5"
			role="img"
			aria-label={`${rating} out of 5 stars`}
		>
			{Array.from({ length: 5 }).map((_, i) => (
				<StarIcon
					key={i}
					className={`size-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-foreground/20"}`}
				/>
			))}
		</div>
	);
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
	return (
		<div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
			<div className="flex items-start justify-between gap-2">
				<StarRating rating={testimonial.rating} />
				<span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
					{testimonial.highlight}
				</span>
			</div>
			<blockquote className="mt-4 flex-1 text-foreground/80 text-sm leading-relaxed">
				"{testimonial.content}"
			</blockquote>
			<div className="mt-6 flex items-center gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
					{testimonial.avatar}
				</div>
				<div>
					<p className="font-semibold text-sm">{testimonial.name}</p>
					<p className="text-foreground/50 text-xs">
						{testimonial.role} · {testimonial.company}
					</p>
				</div>
			</div>
		</div>
	);
}

export function Testimonials() {
	return (
		<section className="py-16 md:py-24" id="testimonials">
			<div className="container">
				<div className="mx-auto mb-12 max-w-2xl text-center">
					<p className="mb-3 font-semibold text-primary text-sm uppercase tracking-wider">
						Customer Stories
					</p>
					<h2 className="font-bold text-3xl md:text-4xl">
						Real businesses, real results
					</h2>
					<p className="mt-4 text-foreground/60 text-lg">
						See how teams and individuals use our AI tools to save
						time and work smarter.
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{testimonials.map((testimonial) => (
						<TestimonialCard
							key={testimonial.id}
							testimonial={testimonial}
						/>
					))}
				</div>

				<div className="mt-12 flex flex-col items-center gap-4 text-center">
					<p className="text-foreground/50 text-sm">
						Trusted by{" "}
						<span className="font-semibold text-foreground/80">
							500+
						</span>{" "}
						small businesses and freelancers
					</p>
					<Link
						href="/auth/sign-up"
						className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm transition-opacity hover:opacity-90"
					>
						Join them — it's free
						<ArrowRightIcon className="size-4" />
					</Link>
					<p className="text-foreground/40 text-xs">
						No credit card required · 100 free credits to start
					</p>
				</div>
			</div>
		</section>
	);
}

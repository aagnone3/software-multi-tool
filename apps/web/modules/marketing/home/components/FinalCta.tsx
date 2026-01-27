import { Button } from "@ui/components/button";
import { ArrowRightIcon, CheckCircleIcon } from "lucide-react";
import Link from "next/link";

const benefits = [
	"No credit card required",
	"Free credits to get started",
	"Cancel anytime",
];

export function FinalCta() {
	return (
		<section className="py-16 lg:py-24">
			<div className="container max-w-4xl">
				<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-12 text-center text-primary-foreground shadow-2xl md:px-12 md:py-16 lg:py-20">
					{/* Decorative elements */}
					<div className="absolute -top-24 -right-24 size-48 rounded-full bg-white/10 blur-3xl" />
					<div className="absolute -bottom-24 -left-24 size-48 rounded-full bg-white/10 blur-3xl" />

					<div className="relative">
						<h2 className="mx-auto max-w-2xl text-balance font-bold text-3xl md:text-4xl lg:text-5xl">
							Ready to transform your productivity with AI?
						</h2>

						<p className="mx-auto mt-4 max-w-xl text-balance text-primary-foreground/80 text-lg">
							Join the league of small business owners who are
							already saving time and boosting productivity with
							our AI tools.
						</p>

						<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Button
								size="lg"
								variant="secondary"
								className="min-w-[200px] bg-white text-primary hover:bg-white/90"
								asChild
							>
								<Link href="/auth/signup">
									Get Started Free
									<ArrowRightIcon className="ml-2 size-4" />
								</Link>
							</Button>
						</div>

						<div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
							{benefits.map((benefit) => (
								<div
									key={benefit}
									className="flex items-center gap-2"
								>
									<CheckCircleIcon className="size-4 text-white/80" />
									<span className="text-white/90">
										{benefit}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

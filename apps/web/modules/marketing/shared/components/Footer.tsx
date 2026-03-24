import { config } from "@repo/config";
import { Logo } from "@shared/components/Logo";
import Link from "next/link";
import React from "react";

export function Footer() {
	return (
		<footer className="border-t py-8 text-foreground/60 text-sm">
			<div className="border-b py-8">
				<div className="container flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
					<div>
						<p className="font-semibold text-foreground text-sm">
							Stay updated with AI tool tips &amp; new features
						</p>
						<p className="text-xs opacity-70">
							No spam. Unsubscribe anytime.
						</p>
					</div>
					<Link
						href="/newsletter"
						className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
					>
						Subscribe to Newsletter
					</Link>
				</div>
			</div>
			<div className="container grid grid-cols-1 gap-6 lg:grid-cols-4">
				<div>
					<Logo className="opacity-70 grayscale" />
					<p className="mt-3 text-sm opacity-70">
						© {new Date().getFullYear()} {config.appName}.{" "}
						<a href="https://github.com/aagnone3/software-multi-tool">
							Built by Life With Data.
						</a>
					</p>
				</div>

				<div className="flex flex-col gap-2">
					{config.ui.blog.enabled && (
						<Link href="/blog" className="block">
							Blog
						</Link>
					)}

					<a href="#features" className="block">
						Features
					</a>

					<a href="/pricing" className="block">
						Pricing
					</a>
					<Link href="/roi-calculator" className="block">
						ROI Calculator
					</Link>
					<Link href="/use-cases" className="block">
						Use Cases
					</Link>
					<Link href="/integrations" className="block">
						Integrations
					</Link>
				</div>

				<div className="flex flex-col gap-2">
					<Link href="/for" className="block">
						By Industry
					</Link>
					<Link href="/for/accountants" className="block">
						For Accountants
					</Link>
					<Link href="/for/lawyers" className="block">
						For Lawyers
					</Link>
					<Link href="/for/consultants" className="block">
						For Consultants
					</Link>
					<Link href="/for/hr-teams" className="block">
						For HR Teams
					</Link>
					<Link href="/for/real-estate" className="block">
						For Real Estate
					</Link>
				</div>
				<div className="flex flex-col gap-2">
					<Link href="/security" className="block">
						Security
					</Link>
					<Link href="/changelog" className="block">
						Changelog
					</Link>
					<Link href="/faq" className="block">
						FAQ
					</Link>
					<Link href="/legal/privacy-policy" className="block">
						Privacy policy
					</Link>
					<Link href="/legal/terms" className="block">
						Terms and conditions
					</Link>
				</div>
			</div>
		</footer>
	);
}

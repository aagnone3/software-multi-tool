import { ContactForm } from "@marketing/home/components/ContactForm";
import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import { redirect } from "next/navigation";
import React from "react";

const siteUrl = getBaseUrl();

export async function generateMetadata() {
	return {
		title: `Contact Us — ${config.appName}`,
		description: `Get in touch with the ${config.appName} team. We're here to help with questions about AI tools, billing, or anything else.`,
		alternates: { canonical: `${siteUrl}/contact` },
		openGraph: {
			type: "website",
			url: `${siteUrl}/contact`,
			title: `Contact Us — ${config.appName}`,
			description: `Have a question? Reach out to the ${config.appName} team. We respond quickly.`,
			siteName: config.appName,
		},
		twitter: {
			card: "summary_large_image",
			title: `Contact Us — ${config.appName}`,
			description: `Have a question? Reach out to the ${config.appName} team.`,
		},
	};
}

export default async function ContactPage() {
	if (!config.contactForm.enabled) {
		redirect("/");
	}

	return (
		<div className="container max-w-xl pt-32 pb-16">
			<div className="mb-12 pt-8 text-center">
				<h1 className="mb-2 font-bold text-5xl">Contact us</h1>
				<p className="text-balance text-lg opacity-50">
					We are here to help you. Please use the form below to get in
					touch with us.
				</p>
			</div>

			<ContactForm />
		</div>
	);
}

import { ContactForm } from "@marketing/home/components/ContactForm";
import { config } from "@repo/config";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	return {
		title: "Contact us",
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

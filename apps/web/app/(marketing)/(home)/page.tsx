import { FaqSection } from "@marketing/home/components/FaqSection";
import { Features } from "@marketing/home/components/Features";
import { Hero } from "@marketing/home/components/Hero";
import { Newsletter } from "@marketing/home/components/Newsletter";
import { PricingSection } from "@marketing/home/components/PricingSection";

export default async function Home() {
	return (
		<>
			<Hero />
			<Features />
			<PricingSection />
			<FaqSection />
			<Newsletter />
		</>
	);
}

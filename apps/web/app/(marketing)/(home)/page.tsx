import { FaqSection } from "@marketing/home/components/FaqSection";
import { Features } from "@marketing/home/components/Features";
import { FinalCta } from "@marketing/home/components/FinalCta";
import { Hero } from "@marketing/home/components/Hero";
import { HowItWorks } from "@marketing/home/components/HowItWorks";
import { PricingSection } from "@marketing/home/components/PricingSection";

export default async function Home() {
	return (
		<>
			<Hero />
			<Features />
			<HowItWorks />
			<PricingSection />
			<FaqSection />
			<FinalCta />
		</>
	);
}

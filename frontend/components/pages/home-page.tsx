import { Suspense } from "react";

import { AboutUsSection } from "../sections/about-us";
import { CategoriesSection } from "../sections/categories";
import { ContactCtaSection } from "../sections/contact-cta";
import { WhyChooseUsSection } from "../sections/why-choose-us";
import Hero from "../sections/hero";

export function HomePage() {
	return (
		<section className='relative flex min-h-dvh w-full flex-1 flex-col bg-canvas text-ink'>
			<Hero />
			<Suspense fallback={null}>
				<CategoriesSection />
			</Suspense>
			<AboutUsSection />
			<WhyChooseUsSection />
			<ContactCtaSection />
		</section>
	);
}

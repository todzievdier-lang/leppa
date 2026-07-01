import { Suspense } from "react";

import { AboutUsSection } from "../sections/about-us";
import {
	CategoriesSection,
	CategoriesSectionSkeleton,
} from "../sections/categories";
import { ContactCtaSection } from "../sections/contact-cta";
import { WhyChooseUsSection } from "../sections/why-choose-us";
import Hero from "../sections/hero";
import { getHomePageContent, getSiteSettings } from "@/lib/api";

export async function HomePage() {
	const [content, settings] = await Promise.all([
		getHomePageContent(),
		getSiteSettings(),
	]);

	if (!content || !settings) {
		return null;
	}

	return (
		<section className='relative flex min-h-dvh w-full flex-1 flex-col bg-canvas text-ink'>
			<Hero
				buttonHref={content.heroButtonHref}
				buttonLabel={content.heroButtonLabel}
				description={content.heroDescription}
				image={content.heroImage}
				title={content.heroTitle}
			/>
			<Suspense fallback={<CategoriesSectionSkeleton title={content.categoriesTitle} description={content.categoriesDescription} />}>
				<CategoriesSection title={content.categoriesTitle} description={content.categoriesDescription} />
			</Suspense>
			<AboutUsSection subsections={content.aboutSections} />
			<WhyChooseUsSection
				description={content.benefitsDescription}
				items={content.benefits}
				title={content.benefitsTitle}
			/>
			<ContactCtaSection
				description={content.ctaDescription}
				messengerLabel={content.ctaMessengerLabel}
				phoneLabel={content.ctaPhoneLabel}
				settings={settings}
				title={content.ctaTitle}
			/>
		</section>
	);
}

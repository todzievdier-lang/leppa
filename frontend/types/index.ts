export type {
	Category,
	CategoryLink,
} from "./catalog";

export type Messenger = {
	label: string;
	value: string;
	href: string;
};

type WorkingHours = {
	label: string;
	value: string;
};

export type Contact = {
	phone: string;
	email: string;
	messengers: Messenger[];
	address: string;
	hours: WorkingHours[];
	mapEmbed: string;
	mapLink: string;
};

export type AboutSubsection = {
	id: string;
	title: string;
	body: string;
	seo_keywords?: string[];
	order: number;
};

export type BenefitIcon = "quality" | "support" | "price" | "delivery";

export type HomeBenefit = {
	id: string;
	title: string;
	description: string;
	icon: BenefitIcon;
};

export type HomePageContent = {
	heroTitle: string;
	heroDescription: string;
	heroButtonLabel: string;
	heroButtonHref: string;
	heroImage: string;
	categoriesTitle: string;
	categoriesDescription: string;
	aboutSections: AboutSubsection[];
	benefitsTitle: string;
	benefitsDescription: string;
	benefits: HomeBenefit[];
	ctaTitle: string;
	ctaDescription: string;
	ctaPhoneLabel: string;
	ctaMessengerLabel: string;
};

export type SiteSettings = Contact & {
	companyName: string;
	footerDescription: string;
	contactTitle: string;
	contactDescription: string;
};

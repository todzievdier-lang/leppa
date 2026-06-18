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
};

export type AboutSubsection = {
	id: string;
	title: string;
	body: string;
	seo_keywords?: string[];
	order: number;
};

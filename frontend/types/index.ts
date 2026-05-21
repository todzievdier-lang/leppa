export type Category = {
	id: string;
	slug: string;
	name: string;
	description: string;
	image?: string | null;
};

export type CategoryLink = Pick<Category, "id" | "slug" | "name">;

export type Messenger = {
	label: string;
	value: string;
	href: string;
};

export type WorkingHours = {
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

export type Contacts = Contact;

export type AboutSubsection = {
	id: string;
	title: string;
	body: string;
	seo_keywords?: string[];
	order: number;
};

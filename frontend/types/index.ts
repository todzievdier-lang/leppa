export type Category = {
	id: string;
	handle: string;
	name: string;
	description: string;
	parentId: string | null;
	imageTone: string;
	imageUrl?: string;
	imageAlt?: string;
	featured: boolean;
	sortOrder: number;
};

export type Messenger = {
	label: string;
	value: string;
	href: string;
};

export type WorkingHours = {
	label: string;
	value: string;
};

export type Contacts = {
	company: string;
	headline: string;
	description: string;
	phone: string;
	email: string;
	messengers: Messenger[];
	address: string;
	hours: WorkingHours[];
	requestTypes: string[];
};

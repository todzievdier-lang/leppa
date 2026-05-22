export type {
	CatalogFilterGroup,
	CatalogFilterOption,
	CatalogFilters,
	CatalogQuery,
	CatalogResult,
	CatalogSort,
	Category,
	CategoryKey,
	CategoryLink,
	CategorySeo,
	PaginationMeta,
	Product,
	ProductAttribute,
	ProductAttributeValue,
	ProductImage,
} from "./catalog";

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

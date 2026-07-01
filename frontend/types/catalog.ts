export type CategoryKey = string;

type CategorySeo = {
	title?: string;
	description?: string;
};

export type Category = {
	key: CategoryKey;
	slug: string;
	name: string;
	englishName: string;
	description: string;
	image?: string | null;
	seo?: CategorySeo;
};

export type CategoryLink = Pick<Category, "key" | "slug" | "name">;

export type ProductAttributeValue = string | number | boolean | string[];

export type ProductAttribute = {
	key: string;
	label: string;
	value: ProductAttributeValue;
	unit?: string;
};

export type ProductImage = {
	url: string;
	thumbnailUrl?: string;
	smallUrl?: string;
	mediumUrl?: string;
	largeUrl?: string;
	role?: string;
	label?: string;
	alt?: string;
};

export type ProductBundleConfig = {
	id: string;
	title: string;
	discountPercent: number;
	productSlugs: string[];
};

export type ProductDescriptionInlineText = {
	type: "text";
	text: string;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
	code?: boolean;
};

export type ProductDescriptionInlineLink = {
	type: "link";
	url: string;
	children: ProductDescriptionInlineNode[];
};

export type ProductDescriptionInlineNode =
	| ProductDescriptionInlineText
	| ProductDescriptionInlineLink;

export type ProductDescriptionListItem = {
	type: "list-item";
	children: ProductDescriptionInlineNode[];
};

export type ProductDescriptionBlock =
	| {
			type: "paragraph" | "quote" | "code";
			children: ProductDescriptionInlineNode[];
		}
	| {
			type: "heading";
			level: 1 | 2 | 3 | 4 | 5 | 6;
			children: ProductDescriptionInlineNode[];
		}
	| {
			type: "list";
			format: "ordered" | "unordered";
			children: ProductDescriptionListItem[];
		};

export type ProductColor = {
	id: string;
	slug: string;
	name: string;
	hex: string;
	sortOrder: number;
};

export type Product = {
	id: string;
	slug: string;
	sku: string | null;
	baseSku: string | null;
	color: ProductColor | null;
	name: string;
	brand: string | null;
	categoryKey: CategoryKey;
	price: number | null;
	currency: string | null;
	inStock: boolean;
	description: string;
	descriptionBlocks: ProductDescriptionBlock[];
	images: ProductImage[];
	videos: string[];
	attributes: ProductAttribute[];
	bundles: ProductBundleConfig[];
};

export type ProductSearchItem = {
	id: string;
	name: string;
	sku: string | null;
	href: string;
	image: string;
	imageAlt: string;
	categoryName: string;
	price: number | null;
	currency: string | null;
	inStock: boolean;
};

export type CatalogSort =
	| "featured"
	| "stock-desc"
	| "name-asc"
	| "name-desc"
	| "price-asc"
	| "price-desc";

export type CatalogFilters = Record<string, string[]>;

export type CatalogQuery = {
	categoryKey?: CategoryKey;
	search?: string;
	page?: number;
	perPage?: number;
	sort?: CatalogSort;
	brand?: string[];
	filters?: CatalogFilters;
};

export type CatalogFilterOption = {
	value: string;
	label: string;
	count: number;
};

export type CatalogFilterGroup = {
	key: string;
	label: string;
	options: CatalogFilterOption[];
};

export type PaginationMeta = {
	page: number;
	perPage: number;
	total: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
};

export type CatalogResult = {
	categories: Category[];
	activeCategory: Category | null;
	products: Product[];
	searchableProducts: Product[];
	total: number;
	pagination: PaginationMeta;
	query: Required<Pick<CatalogQuery, "page" | "perPage" | "sort">> &
		Omit<CatalogQuery, "page" | "perPage" | "sort">;
	brandOptions: CatalogFilterOption[];
	filterGroups: CatalogFilterGroup[];
};

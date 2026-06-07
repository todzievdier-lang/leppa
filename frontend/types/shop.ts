export type ShopProductOption = {
	label: string;
	value: string;
};

export type ShopProductSnapshot = {
	id: string;
	lineId?: string;
	name: string;
	sku: string | null;
	href: string;
	image: string;
	priceLabel: string;
	inStock: boolean;
	price?: number | null;
	currency?: string | null;
	selectedOptions?: ShopProductOption[];
};

export type CartLine = {
	product: ShopProductSnapshot;
	quantity: number;
	addedAt: number;
};

export type ShopState = {
	cart: CartLine[];
	favorites: ShopProductSnapshot[];
};

export type ShopToast = {
	id?: string;
	title: string;
	description?: string;
};

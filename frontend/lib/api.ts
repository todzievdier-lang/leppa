import contacts from "@/data/contacts.json";

import type { Category, CategoryLink, Contact } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type RichTextChild = {
	text?: unknown;
};

type RichTextBlock = {
	children: RichTextChild[];
};

type StrapiCategory = {
	id: number | string;
	name?: string;
	slug?: string;
	description?: unknown;
	image?: {
		url?: string | null;
	} | null;
};

type StrapiCategoriesResponse = {
	data: StrapiCategory[];
};

const contactData: Contact = contacts;

function isRichTextBlock(block: unknown): block is RichTextBlock {
	if (typeof block !== "object" || block === null) {
		return false;
	}

	const maybeBlock = block as { children?: unknown };

	return Array.isArray(maybeBlock.children);
}

function parseDescription(description: unknown): string {
	if (!Array.isArray(description)) {
		return "";
	}

	return description
		.map((block) => {
			if (!isRichTextBlock(block)) {
				return "";
			}

			return block.children
				.map((child) => (typeof child.text === "string" ? child.text : ""))
				.join("");
		})
		.join("\n");
}

function getImageUrl(imageUrl?: string | null) {
	if (!imageUrl) {
		return null;
	}

	if (imageUrl.startsWith("http")) {
		return imageUrl;
	}

	return API_URL ? `${API_URL}${imageUrl}` : imageUrl;
}

function mapCategoryLink(item: StrapiCategory): CategoryLink {
	return {
		id: String(item.id),
		name: item.name ?? "",
		slug: item.slug ?? "",
	};
}

async function fetchCategoryItems(
	query: string,
	errorMessage: string,
): Promise<StrapiCategory[]> {
	try {
		const response = await fetch(`${API_URL}/api/categories?${query}`, {
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(errorMessage);
		}

		const json = (await response.json()) as StrapiCategoriesResponse;

		return json.data;
	} catch (error) {
		console.error(errorMessage, error);

		throw error;
	}
}

export async function getCategories(): Promise<Category[]> {
	const categories = await fetchCategoryItems(
		"populate=image",
		"Failed to get categories",
	);

	return categories.map((item) => ({
		...mapCategoryLink(item),
		description: parseDescription(item.description),
		image: getImageUrl(item.image?.url),
	}));
}

export async function getFooterCategories(): Promise<CategoryLink[]> {
	const categories = await fetchCategoryItems(
		"fields[0]=name&fields[1]=slug",
		"Failed to get footer categories",
	);

	return categories.map(mapCategoryLink);
}

export async function getContact(): Promise<Contact> {
	return contactData;
}

import contacts from "@/data/contacts.json";

import type { Category, Contact } from "@/types";

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

export async function getCategories(): Promise<Category[]> {
	try {
		const response = await fetch(`${API_URL}/api/categories?populate=image`, {
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error("Failed to fetch categories");
		}

		const json = (await response.json()) as StrapiCategoriesResponse;

		return json.data.map((item) => ({
			id: String(item.id),
			name: item.name ?? "",
			slug: item.slug ?? "",
			description: parseDescription(item.description),
			image: getImageUrl(item.image?.url),
		}));
	} catch (error) {
		console.error("Failed to get categories", error);

		throw error;
	}
}

export async function getContact(): Promise<Contact> {
	return contactData;
}

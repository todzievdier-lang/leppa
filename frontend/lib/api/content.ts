import type {
	AboutSubsection,
	BenefitIcon,
	HomeBenefit,
	HomePageContent,
	Messenger,
	SiteSettings,
} from "@/types";

type PlainRecord = Record<string, unknown>;

function getString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
}

function isRecord(value: unknown): value is PlainRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getFields(value: unknown): PlainRecord | null {
	if (!isRecord(value)) {
		return null;
	}

	const attributes = isRecord(value.attributes) ? value.attributes : {};
	return { ...value, ...attributes };
}

function getArray(value: unknown): unknown[] {
	if (Array.isArray(value)) {
		return value;
	}

	if (isRecord(value) && Array.isArray(value.data)) {
		return value.data;
	}

	return [];
}

function getApiUrl(): string | null {
	const values = [
		process.env.STRAPI_API_URL,
		process.env.NEXT_PUBLIC_STRAPI_GLOBAL_URL,
		process.env.NEXT_PUBLIC_STRAPI_URL,
		process.env.NEXT_PUBLIC_API_URL,
	];

	for (const value of values) {
		const normalized = value?.trim().replace(/\/+$/, "");
		if (normalized && !normalized.includes("api.example.com")) {
			return normalized;
		}
	}

	return null;
}

const STRAPI_API_URL = getApiUrl();

function getHeaders(): HeadersInit | undefined {
	if (STRAPI_API_URL) {
		try {
			const hostname = new URL(STRAPI_API_URL).hostname;
			if (["localhost", "127.0.0.1", "::1"].includes(hostname)) {
				return undefined;
			}
		} catch {
			return undefined;
		}
	}

	const token = process.env.STRAPI_API_TOKEN?.trim();
	return token ? { Authorization: `Bearer ${token}` } : undefined;
}

async function fetchSingleType(pathname: string, populate: string): Promise<PlainRecord | null> {
	if (!STRAPI_API_URL) {
		console.error("[strapi] API URL is not configured.");
		return null;
	}

	const url = new URL(pathname, STRAPI_API_URL);
	url.searchParams.set("populate", populate);

	try {
		const response = await fetch(url, {
			headers: getHeaders(),
			cache: "no-store",
		});

		if (!response.ok) {
			console.error(`[strapi] ${pathname} failed: ${response.status} ${response.statusText}`);
			return null;
		}

		const payload = await response.json() as unknown;
		return isRecord(payload) ? getFields(payload.data) : null;
	} catch (error) {
		console.error(
			`[strapi] ${pathname} failed: ${error instanceof Error ? error.message : "unknown error"}`,
		);
		return null;
	}
}

function resolveAssetUrl(value: unknown): string {
	const media = isRecord(value) && "data" in value ? value.data : value;
	const fields = getFields(Array.isArray(media) ? media[0] : media);
	const url = getString(fields?.url);

	if (!url || !STRAPI_API_URL) {
		return url;
	}

	return /^https?:\/\//i.test(url) ? url : new URL(url, STRAPI_API_URL).toString();
}

function mapMessengers(value: unknown): Messenger[] {
	return getArray(value)
		.map(getFields)
		.filter((item): item is PlainRecord => item !== null)
		.map((item) => ({
			label: getString(item.label),
			value: getString(item.value),
			href: getString(item.href),
		}))
		.filter((item) => item.label && item.href);
}

function mapAboutSections(value: unknown): AboutSubsection[] {
	return getArray(value)
		.map(getFields)
		.filter((item): item is PlainRecord => item !== null)
		.map((item, index) => ({
			id: getString(item.id) || String(index + 1),
			title: getString(item.title),
			body: getString(item.body),
			order: getNumber(item.order) ?? index,
		}))
		.filter((item) => item.title && item.body)
		.sort((left, right) => left.order - right.order);
}

function isBenefitIcon(value: string): value is BenefitIcon {
	return ["quality", "support", "price", "delivery"].includes(value);
}

function mapBenefits(value: unknown): HomeBenefit[] {
	return getArray(value)
		.map(getFields)
		.filter((item): item is PlainRecord => item !== null)
		.map((item, index) => {
			const icon = getString(item.icon);
			return {
				id: getString(item.id) || String(index + 1),
				title: getString(item.title),
				description: getString(item.description),
				icon: isBenefitIcon(icon) ? icon : "quality",
			};
		})
		.filter((item) => item.title && item.description);
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
	const fields = await fetchSingleType("/api/site-setting", "*");

	if (!fields) {
		return null;
	}

	return {
		companyName: getString(fields.companyName),
		footerDescription: getString(fields.footerDescription),
		contactTitle: getString(fields.contactTitle),
		contactDescription: getString(fields.contactDescription),
		phone: getString(fields.phone),
		email: getString(fields.email),
		messengers: mapMessengers(fields.messengers),
		address: getString(fields.address),
		hours: getArray(fields.hours)
			.map(getFields)
			.filter((item): item is PlainRecord => item !== null)
			.map((item) => ({ label: getString(item.label), value: getString(item.value) }))
			.filter((item) => item.label && item.value),
		mapEmbed: getString(fields.mapEmbed),
		mapLink: getString(fields.mapLink),
	};
}

export async function getHomePageContent(): Promise<HomePageContent | null> {
	const fields = await fetchSingleType("/api/home-page", "*");

	if (!fields) {
		return null;
	}

	return {
		heroTitle: getString(fields.heroTitle),
		heroDescription: getString(fields.heroDescription),
		heroButtonLabel: getString(fields.heroButtonLabel),
		heroButtonHref: getString(fields.heroButtonHref),
		heroImage: resolveAssetUrl(fields.heroImage),
		categoriesTitle: getString(fields.categoriesTitle),
		categoriesDescription: getString(fields.categoriesDescription),
		aboutSections: mapAboutSections(fields.aboutSections),
		benefitsTitle: getString(fields.benefitsTitle),
		benefitsDescription: getString(fields.benefitsDescription),
		benefits: mapBenefits(fields.benefits),
		ctaTitle: getString(fields.ctaTitle),
		ctaDescription: getString(fields.ctaDescription),
		ctaPhoneLabel: getString(fields.ctaPhoneLabel),
		ctaMessengerLabel: getString(fields.ctaMessengerLabel),
	};
}

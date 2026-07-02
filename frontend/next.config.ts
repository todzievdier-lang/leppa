import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

function normalizeUrl(value: string | undefined): URL | null {
	const normalizedValue = value?.trim().replace(/\/+$/, "");

	if (!normalizedValue || normalizedValue.includes("api.example.com")) {
		return null;
	}

	try {
		return new URL(normalizedValue);
	} catch {
		return null;
	}
}

const configuredStrapiUrls = [
	normalizeUrl(process.env.NEXT_PUBLIC_STRAPI_GLOBAL_URL),
	normalizeUrl(process.env.NEXT_PUBLIC_STRAPI_URL),
	normalizeUrl(process.env.NEXT_PUBLIC_API_URL),
	normalizeUrl(process.env.STRAPI_API_URL),
].filter((url): url is URL => url !== null);

const uniqueConfiguredStrapiUrls = [
	...new Map(configuredStrapiUrls.map((url) => [url.toString(), url])).values(),
];

const configuredStrapiImagePatterns = uniqueConfiguredStrapiUrls.map((url) => ({
	protocol: url.protocol.replace(":", "") as "http" | "https",
	hostname: url.hostname,
	port: url.port,
	pathname: "/uploads/**",
}));

const configuredStrapiCloudImagePatterns = uniqueConfiguredStrapiUrls
	.filter((url) => url.hostname.endsWith(".strapiapp.com"))
	.map((url) => ({
		protocol: "https" as const,
		hostname: url.hostname.replace(".strapiapp.com", ".media.strapiapp.com"),
		pathname: "/**",
	}));

const strapiCloudMediaImagePattern = {
	protocol: "https" as const,
	hostname: "*.media.strapiapp.com",
	pathname: "/**",
};

const nextConfig: NextConfig = {
	compress: true,
	poweredByHeader: false,
	experimental: {
		// Keep dynamic product page payloads in the client Router Cache. Next.js
		// otherwise gives dynamic pages a 0 second TTL, so opening the same product
		// again performs the same server navigation and shows its loading boundary.
		staleTimes: {
			dynamic: 300,
			static: 300,
		},
	},
	async headers() {
		return [
			{
				source: "/hero-bg.jpg",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=86400, stale-while-revalidate=2592000",
					},
				],
			},
			{
				source: "/no-image.webp",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
			{
				source: "/catalog/:path*",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
					},
				],
			},
		];
	},
	images: {
		// Next.js 16 blocks localhost/private IPs unless explicitly allowed.
		dangerouslyAllowLocalIP: isDevelopment,
		// Product images use four intentional quality tiers. The original media
		// remains untouched in Strapi; Next.js serves responsive AVIF/WebP variants.
		formats: ["image/avif", "image/webp"],
		qualities: [60, 65, 75, 85],
		minimumCacheTTL: THIRTY_DAYS_IN_SECONDS,
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
				port: "1337",
				pathname: "/uploads/**",
			},
			{
				protocol: "http",
				hostname: "127.0.0.1",
				port: "1337",
				pathname: "/uploads/**",
			},
			strapiCloudMediaImagePattern,
			...configuredStrapiImagePatterns,
			...configuredStrapiCloudImagePatterns,
		],
	},
};

export default nextConfig;

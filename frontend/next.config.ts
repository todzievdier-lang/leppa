import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

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
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "Cache-Control",
						value: "no-store, no-cache, max-age=0, must-revalidate",
					},
					{
						key: "Pragma",
						value: "no-cache",
					},
					{
						key: "Expires",
						value: "0",
					},
				],
			},
		];
	},
	images: {
		// Next.js 16 blocks localhost/private IPs unless explicitly allowed.
		dangerouslyAllowLocalIP: isDevelopment,
		// Product images use four intentional quality tiers. The original media
		// remains untouched in Strapi; Next.js serves responsive WebP variants.
		formats: ["image/webp"],
		qualities: [60, 65, 75, 85],
		minimumCacheTTL: 0,
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

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

const configuredStrapiUrl =
	normalizeUrl(process.env.NEXT_PUBLIC_STRAPI_GLOBAL_URL)
	?? normalizeUrl(process.env.NEXT_PUBLIC_STRAPI_URL)
	?? normalizeUrl(process.env.NEXT_PUBLIC_API_URL)
	?? normalizeUrl(process.env.STRAPI_API_URL);

const configuredStrapiImagePattern = configuredStrapiUrl
	? {
			protocol: configuredStrapiUrl.protocol.replace(":", "") as "http" | "https",
			hostname: configuredStrapiUrl.hostname,
			port: configuredStrapiUrl.port,
			pathname: "/uploads/**",
		}
	: null;

const configuredStrapiCloudImagePattern =
	configuredStrapiUrl?.hostname.endsWith(".strapiapp.com")
		? {
				protocol: "https" as const,
				hostname: configuredStrapiUrl.hostname.replace(
					".strapiapp.com",
					".media.strapiapp.com",
				),
				pathname: "/**",
			}
		: null;

const strapiCloudMediaImagePattern = {
	protocol: "https" as const,
	hostname: "*.media.strapiapp.com",
	pathname: "/**",
};

const nextConfig: NextConfig = {
	images: {
		// Next.js 16 blocks localhost/private IPs unless explicitly allowed.
		dangerouslyAllowLocalIP: isDevelopment,
		// Product images use four intentional quality tiers. The original media
		// remains untouched in Strapi; Next.js serves responsive WebP variants.
		formats: ["image/webp"],
		qualities: [60, 65, 75, 85],
		minimumCacheTTL: 60 * 60 * 24 * 30,
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
			...(configuredStrapiImagePattern ? [configuredStrapiImagePattern] : []),
			...(configuredStrapiCloudImagePattern
				? [configuredStrapiCloudImagePattern]
				: []),
		],
	},
};

export default nextConfig;

import type { Metadata } from "next";

import { CatalogListing } from "@/components/catalog/catalog-listing";
import { getCatalog } from "@/lib/api";
import {
	parseCatalogSearchParams,
	type CatalogSearchParams,
} from "@/lib/catalog/query";

export const metadata: Metadata = {
	title: "Каталог | Leppa & WenSton",
	description:
		"Каталог Leppa & WenSton: сантехника, зеркала и оборудование для современных ванных комнат.",
};

export default async function CatalogPage({
	searchParams,
}: {
	searchParams: Promise<CatalogSearchParams>;
}) {
	const query = parseCatalogSearchParams(await searchParams);
	const result = await getCatalog(query);

	return (
		<CatalogListing
			basePath="/catalog"
			result={result}
		/>
	);
}

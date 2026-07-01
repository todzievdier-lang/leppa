import { NextResponse } from "next/server";

import { getProductSearchItems } from "@/lib/api/catalog";

export const revalidate = 300;

export async function GET() {
	const products = await getProductSearchItems();

	return NextResponse.json(
		{ products },
		{
			headers: {
				"Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
			},
		},
	);
}

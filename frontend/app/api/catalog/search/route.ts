import { NextResponse } from "next/server";

import { getProductSearchItems } from "@/lib/api/catalog";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
	const products = await getProductSearchItems();

	return NextResponse.json(
		{ products },
		{
			headers: {
				"Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
				Expires: "0",
				Pragma: "no-cache",
			},
		},
	);
}

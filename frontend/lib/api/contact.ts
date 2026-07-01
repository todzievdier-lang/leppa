import { getSiteSettings } from "./content";

import type { SiteSettings } from "@/types";

export async function getContact(): Promise<SiteSettings | null> {
	return getSiteSettings();
}

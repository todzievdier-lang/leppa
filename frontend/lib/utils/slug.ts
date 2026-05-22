const CYRILLIC_TO_LATIN: Record<string, string> = {
	а: "a",
	б: "b",
	в: "v",
	г: "g",
	д: "d",
	е: "e",
	ё: "e",
	ж: "zh",
	з: "z",
	и: "i",
	й: "y",
	к: "k",
	л: "l",
	м: "m",
	н: "n",
	о: "o",
	п: "p",
	р: "r",
	с: "s",
	т: "t",
	у: "u",
	ф: "f",
	х: "kh",
	ц: "ts",
	ч: "ch",
	ш: "sh",
	щ: "sch",
	ъ: "",
	ы: "y",
	ь: "",
	э: "e",
	ю: "yu",
	я: "ya",
};

export function normalizeSlug(value: string): string {
	return value.trim().toLowerCase();
}

export function slugify(value: string): string {
	const transliterated = normalizeSlug(value)
		.split("")
		.map((character) => CYRILLIC_TO_LATIN[character] ?? character)
		.join("");

	return transliterated
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-|-$/g, "");
}

export function isSameSlug(left: string, right: string): boolean {
	return normalizeSlug(left) === normalizeSlug(right);
}

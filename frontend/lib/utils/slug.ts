function normalizeSlug(value: string): string {
	return value.trim().toLowerCase();
}

export function isSameSlug(left: string, right: string): boolean {
	return normalizeSlug(left) === normalizeSlug(right);
}

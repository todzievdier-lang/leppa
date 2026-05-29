export async function copyTextToClipboard(text: string): Promise<boolean> {
	if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Fall back to a temporary textarea below.
		}
	}

	if (typeof document === "undefined") {
		return false;
	}

	const textarea = document.createElement("textarea");

	textarea.value = text;
	textarea.setAttribute("readonly", "");
	textarea.style.position = "fixed";
	textarea.style.opacity = "0";
	textarea.style.pointerEvents = "none";
	document.body.appendChild(textarea);
	textarea.select();

	try {
		const didCopy = document.execCommand("copy");

		document.body.removeChild(textarea);
		return didCopy;
	} catch {
		document.body.removeChild(textarea);
		return false;
	}
}

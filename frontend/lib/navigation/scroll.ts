export function scrollToPageTopInstantly() {
	const root = document.documentElement;
	const previousScrollBehavior = root.style.scrollBehavior;

	root.style.scrollBehavior = "auto";
	window.scrollTo(0, 0);

	window.requestAnimationFrame(() => {
		root.style.scrollBehavior = previousScrollBehavior;
	});
}

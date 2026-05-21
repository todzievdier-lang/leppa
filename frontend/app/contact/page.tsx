import type { Metadata } from "next";

import { ContactSection } from "@/components/sections/contact";

export const metadata: Metadata = {
	title: "Контакты | Leppa & WenSton",
	description:
		"Контакты Leppa & WenSton: телефон, email, мессенджеры, адрес и карта проезда.",
};

export default function ContactRoutePage() {
	return (
		<div className="relative flex min-h-dvh w-full flex-1 flex-col bg-canvas text-ink">
			<ContactSection />
		</div>
	);
}

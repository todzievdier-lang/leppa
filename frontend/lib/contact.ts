import type { Contact, Messenger } from "@/types";

export function getPhoneHref(phone: string) {
	return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function getEmailHref(email: string) {
	return `mailto:${email}`;
}

export function isExternalContactHref(href: string) {
	return /^https?:\/\//.test(href);
}

export function getPrimaryMessenger(
	contact: Pick<Contact, "messengers" | "phone">,
) {
	return contact.messengers.find((messenger) => {
		const searchValue =
			`${messenger.label} ${messenger.href}`.toLocaleLowerCase("ru-RU");

		return searchValue.includes("whatsapp") || searchValue.includes("wa.me");
	});
}

export function getFallbackWhatsAppHref(phone: string) {
	const whatsappPhone = phone.replace(/[^\d]/g, "");

	return `https://wa.me/${whatsappPhone}`;
}

export function getMessengerKey(messenger: Messenger) {
	return `${messenger.label}-${messenger.href}`;
}

import contacts from "@/data/contacts.json";

import type { Contact } from "@/types";

const contactData: Contact = contacts;

export async function getContact(): Promise<Contact> {
	return contactData;
}

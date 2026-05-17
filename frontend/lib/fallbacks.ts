import type { Category, Contacts } from "@/types";

export const FALLBACK_CATEGORIES: Category[] = [
	{
		id: "fallback_toilets",
		handle: "unitazy",
		name: "Унитазы",
		description:
			"Подвесные и напольные модели с чистой геометрией, надежной арматурой и спокойной эстетикой.",
		parentId: null,
		imageTone: "ceramic",
		featured: true,
		sortOrder: 10,
	},
	{
		id: "fallback_smart_toilets",
		handle: "umnye-unitazy",
		name: "Умные унитазы",
		description:
			"Интеллектуальная сантехника для проектов, где важны комфорт, гигиена и продуманное управление.",
		parentId: null,
		imageTone: "smart",
		featured: true,
		sortOrder: 20,
	},
	{
		id: "fallback_sinks",
		handle: "rakoviny",
		name: "Раковины",
		description:
			"Аккуратная керамика и современные формы для частных интерьеров и проектных комплектаций.",
		parentId: null,
		imageTone: "stone",
		featured: false,
		sortOrder: 30,
	},
	{
		id: "fallback_water_heaters",
		handle: "vodonagrevateli",
		name: "Водонагреватели",
		description:
			"Компактные решения для стабильной подачи горячей воды в квартирах, домах и коммерческих объектах.",
		parentId: null,
		imageTone: "water",
		featured: true,
		sortOrder: 40,
	},
	{
		id: "fallback_mirrors",
		handle: "zerkala",
		name: "Зеркала",
		description:
			"LED-зеркала с мягкой подсветкой, антизапотеванием и тонкими деталями для современной ванной.",
		parentId: null,
		imageTone: "mirror",
		featured: true,
		sortOrder: 50,
	},
];

export const FALLBACK_CONTACTS: Contacts = {
	company: "Leppa & WenSton",
	headline: "Подберем сантехнику и зеркала под ваш проект",
	description:
		"Поможем подобрать сантехнику, зеркала и оборудование, подготовим предложение и ответим на вопросы.",
	phone: "+7 980 011-88-03",
	email: "jora41san@yandex.ru",
	messengers: [
		{
			label: "WhatsApp",
			value: "+7 980 011-88-03",
			href: "https://wa.me/79800118803",
		},
	],
	address: "ТЦ Сантехника, павильон A 19/4-5",
	hours: [
		{
			label: "Пн-Пт",
			value: "10:00-19:00",
		},
		{
			label: "Сб",
			value: "11:00-17:00",
		},
	],
	requestTypes: [
		"Розничный заказ",
		"Оптовая поставка",
		"Комплектация проекта",
	],
};

import type { Category } from "@/types/catalog";

export const categories = [
	{
		key: "toilets",
		slug: "unitazy",
		name: "Унитазы",
		englishName: "Toilets",
		description:
			"Напольные и подвесные унитазы Leppa с аккуратной геометрией, безободковыми чашами и надежной сантехнической базой для частных и проектных интерьеров.",
		image: null,
		seo: {
			title: "Унитазы Leppa",
			description:
				"Каталог унитазов Leppa: напольные и подвесные модели для современных ванных комнат.",
		},
	},
	{
		key: "smart-toilets",
		slug: "umnye-unitazy",
		name: "Умные унитазы",
		englishName: "Smart Toilets",
		description:
			"Умные унитазы WenSton с современной электроникой, комфортными функциями и чистой визуальной подачей для премиальных санузлов.",
		image: null,
		seo: {
			title: "Умные унитазы WenSton",
			description:
				"Умные унитазы WenSton с продуманными функциями для современной ванной комнаты.",
		},
	},
	{
		key: "sinks",
		slug: "rakoviny",
		name: "Раковины",
		englishName: "Sinks",
		description:
			"Раковины Leppa для цельных интерьерных решений: выразительная форма, практичные материалы и спокойная премиальная эстетика.",
		image: null,
		seo: {
			title: "Раковины Leppa",
			description:
				"Каталог раковин Leppa для частных интерьеров и комплектации проектов.",
		},
	},
	{
		key: "mirrors",
		slug: "zerkala",
		name: "Зеркала",
		englishName: "Mirrors",
		description:
			"Зеркала WenSton с подсветкой, сенсорным управлением и антизапотеванием в разных размерах и отделках.",
		image: null,
		seo: {
			title: "Зеркала WenSton",
			description:
				"Зеркала WenSton с подсветкой, сенсорным управлением и антизапотеванием.",
		},
	},
	{
		key: "water-heaters",
		slug: "vodonagrevateli",
		name: "Водонагреватели",
		englishName: "Water Heaters",
		description:
			"Проточные водонагреватели WenSton для компактных, аккуратных и функциональных решений в ванной комнате.",
		image: null,
		seo: {
			title: "Водонагреватели WenSton",
			description:
				"Проточные водонагреватели WenSton: компактные модели для ванной комнаты.",
		},
	},
] satisfies Category[];

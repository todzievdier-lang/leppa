import {
	Bath,
	Droplets,
	Flame,
	ShowerHead,
	Sparkles,
	Toilet,
	type LucideIcon,
} from "lucide-react";

type CategoryVisual = {
	icon: LucideIcon;
	gradientClassName: string;
	surfaceClassName: string;
};

const categoryVisuals: Record<string, CategoryVisual> = {
	ceramic: {
		icon: Toilet,
		gradientClassName: "from-white via-zinc-100 to-neutral-200",
		surfaceClassName: "bg-white/65",
	},
	smart: {
		icon: Sparkles,
		gradientClassName: "from-zinc-950 via-zinc-700 to-zinc-300",
		surfaceClassName: "bg-white/18",
	},
	stone: {
		icon: Bath,
		gradientClassName: "from-stone-50 via-neutral-200 to-white",
		surfaceClassName: "bg-white/60",
	},
	water: {
		icon: Flame,
		gradientClassName: "from-sky-50 via-cyan-100 to-white",
		surfaceClassName: "bg-white/62",
	},
	mirror: {
		icon: Droplets,
		gradientClassName: "from-zinc-50 via-blue-100 to-white",
		surfaceClassName: "bg-white/58",
	},
	default: {
		icon: ShowerHead,
		gradientClassName: "from-white via-zinc-100 to-neutral-200",
		surfaceClassName: "bg-white/60",
	},
};

export function getCategoryVisual(imageTone: string) {
	return categoryVisuals[imageTone] ?? categoryVisuals.default;
}

import { BadgeCheck, BadgePercent, Headphones, Truck } from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { BenefitIcon, HomeBenefit } from "@/types";

type WhyChooseUsItem = {
	title: string;
	description: string;
	icon: LucideIcon;
};

const benefitIcons: Record<BenefitIcon, LucideIcon> = {
	quality: BadgeCheck,
	support: Headphones,
	price: BadgePercent,
	delivery: Truck,
};

function WhyChooseUsCard({ title, description, icon: Icon }: WhyChooseUsItem) {
	return (
		<article className="hover-lift-card flex h-full min-h-[260px] flex-col rounded-md border border-hairline bg-canvas p-5 shadow-control sm:p-6">
			<div className="mt-4 w-full flex items-center justify-center">
				<div className="flex size-16 items-center justify-center rounded-full border border-hairline bg-frost text-ink shadow-control">
					<Icon
						aria-hidden="true"
						className="h-8 w-8"
						strokeWidth={1.75}
					/>
				</div>
			</div>

			<h3 className="mt-5 text-2xl font-semibold text-ink text-center">
				{title}
			</h3>
			<p className="mt-3 text-base text-ink-muted text-center">{description}</p>
		</article>
	);
}

export function WhyChooseUsSection({
	description,
	items,
	title,
}: {
	description: string;
	items: HomeBenefit[];
	title: string;
}) {
	const whyChooseUsItems: WhyChooseUsItem[] = items.map((item) => ({
		title: item.title,
		description: item.description,
		icon: benefitIcons[item.icon],
	}));

	if (whyChooseUsItems.length === 0) {
		return null;
	}

	return (
		<section
			id="why-choose-us"
			aria-labelledby="why-choose-us-title"
			className="bg-frost text-ink">
			<div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-14 sm:px-8 sm:pb-12 sm:pt-16 lg:px-14 lg:pb-14 lg:pt-20">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="text-3xl font-semibold text-ink sm:text-4xl lg:text-6xl">
						{title}
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-sm text-ink-muted sm:text-base lg:text-lg">
						{description}
					</p>
				</div>

				<div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
					{whyChooseUsItems.map((item, i) => (
						<WhyChooseUsCard
							key={i}
							{...item}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

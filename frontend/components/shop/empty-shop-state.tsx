"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function EmptyShopState({
	actionText = "Перейти в каталог",
	description,
	icon,
	title,
}: {
	actionText?: string;
	description: string;
	icon: ReactNode;
	title: string;
}) {
	return (
		<div className="flex min-h-[360px] w-full max-w-[720px] flex-col items-center justify-center rounded-chrome-panel border border-dashed border-hairline-strong bg-frost px-6 py-12 text-center">
			<div className="mb-5 flex size-14 items-center justify-center rounded-full border border-hairline bg-canvas text-ink-muted shadow-control">
				{icon}
			</div>
			<h2 className="text-2xl font-semibold text-ink">{title}</h2>
			<p className="mt-3 max-w-md text-sm text-ink-muted">
				{description}
			</p>
			<Button
				asChild
				variant="dark"
				className="mt-7">
				<Link href="/catalog">{actionText}</Link>
			</Button>
		</div>
	);
}

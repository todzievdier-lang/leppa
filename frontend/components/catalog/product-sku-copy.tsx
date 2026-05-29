"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { emitShopToast } from "@/lib/shop/store";
import { copyTextToClipboard } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils";

type ProductSkuCopySize = "compact" | "detail";

export function ProductSkuCopy({
	className,
	size = "compact",
	sku,
}: {
	className?: string;
	size?: ProductSkuCopySize;
	sku: string | null;
}) {
	const normalizedSku = sku?.trim() ?? "";
	const hasSku = normalizedSku.length > 0;
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) {
			return;
		}

		const timeout = window.setTimeout(() => {
			setCopied(false);
		}, 1600);

		return () => {
			window.clearTimeout(timeout);
		};
	}, [copied]);

	async function handleCopy() {
		if (!hasSku) {
			return;
		}

		const didCopy = await copyTextToClipboard(normalizedSku);

		if (didCopy) {
			setCopied(true);
			emitShopToast({
				title: "Артикул скопирован",
				description: normalizedSku,
			});
		} else {
			emitShopToast({
				title: "Не удалось скопировать артикул",
				description: normalizedSku,
			});
		}
	}

	return (
		<div
			className={cn(
				"flex min-w-0 items-center gap-2",
				size === "detail"
					? "text-base sm:text-lg"
					: "text-xs leading-none",
				className,
			)}>
			<span className="shrink-0 font-medium text-ink-faint">Артикул:</span>
			<span
				className={cn(
					"min-w-0 truncate font-semibold text-ink",
					!hasSku && "font-medium text-ink-muted",
				)}>
				{hasSku ? normalizedSku : "отсутствует"}
			</span>
			{hasSku ? (
				<button
					type="button"
					aria-label={`Скопировать артикул ${normalizedSku}`}
					className={cn(
						"pointer-events-auto inline-flex shrink-0 items-center justify-center rounded-full border border-transparent text-ink-muted transition-colors duration-200 hover:border-hairline hover:bg-frost hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
						size === "detail" ? "size-9" : "size-7",
					)}
					onClick={handleCopy}>
					{copied ? (
						<Check
							aria-hidden="true"
							className={size === "detail" ? "size-5" : "size-4"}
						/>
					) : (
						<Copy
							aria-hidden="true"
							className={size === "detail" ? "size-5" : "size-4"}
						/>
					)}
				</button>
			) : (
				<span
					className={cn(
						"inline-flex shrink-0",
						size === "detail" ? "size-9" : "size-7",
					)}
				/>
			)}
		</div>
	);
}

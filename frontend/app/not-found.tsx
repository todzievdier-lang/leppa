import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className='mx-auto flex w-full min-h-screen flex-1 items-center justify-center px-4'>
			<div className='flex min-h-[360px] flex-col items-center justify-center rounded-chrome-panel border border-dashed border-hairline-strong bg-frost px-6 py-12 text-center'>
				<div className='mb-5 flex size-14 items-center justify-center rounded-full border border-hairline bg-canvas shadow-control'>
					<SearchX
						className='h-6 w-6 text-ink-muted'
						aria-hidden='true'
					/>
				</div>
				<h2 className='text-2xl font-semibold text-ink'>Страница не найдена</h2>
				<p className='mt-3 max-w-md text-sm text-ink-muted'>
					Такого раздела или товара нет в текущем каталоге.
				</p>
				<Button
					asChild
					variant='dark'
					className='mt-7'>
					<Link href='/catalog'>Вернуться в каталог</Link>
				</Button>
			</div>
		</div>
	);
}

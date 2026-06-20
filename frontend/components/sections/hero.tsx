import Image from "next/image";
import { Button } from "../ui/button";
import Link from "next/link";

const Hero = () => {
	return (
		<div className="relative flex min-h-dvh w-full flex-1 items-center justify-center overflow-hidden">
			<Image
				src="/hero-bg.jpg"
				alt="Премиальная сантехника и ванная комната"
				fill
				priority
				quality={100}
				sizes="100vw"
				className="absolute inset-0 object-cover"
			/>
			<div className="absolute inset-0 bg-scrim" />

			<div className="flex flex-col justify-center items-center relative z-20 max-w-5xl px-4 sm:px-6 text-center text-on-dark">
				<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-normal tracking-tight text-on-dark mb-4 md:mb-6">
					Leppa &amp; WenSton
				</h1>

				<p className="mx-auto mb-8 max-w-2xl text-base sm:text-lg md:text-xl font-light text-on-dark">
					Премиальная сантехника и архитектура ванной комнаты: выразительные
					материалы, точная геометрия и эстетика спокойной роскоши.
				</p>
				<Button
					asChild
					variant="primary">
					<Link href="#categories">Смотреть каталог</Link>
				</Button>
			</div>
		</div>
	);
};

export default Hero;

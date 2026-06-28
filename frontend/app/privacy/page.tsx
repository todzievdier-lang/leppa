import type { Metadata } from "next";

import Link from "next/link";

import { ShieldCheck } from "lucide-react";

import contacts from "@/data/contacts.json";

export const metadata: Metadata = {
	title: "Политика конфиденциальности | Leppa & WenSton",
	description:
		"Политика Leppa & WenSton в отношении обработки и защиты персональных данных пользователей сайта.",
};

const policySections = [
	{ id: "general", label: "Общие положения" },
	{ id: "data", label: "Какие данные обрабатываются" },
	{ id: "purposes", label: "Цели и основания" },
	{ id: "processing", label: "Порядок обработки" },
	{ id: "services", label: "Сервисы и передача" },
	{ id: "storage", label: "Хранение и защита" },
	{ id: "rights", label: "Права пользователя" },
	{ id: "updates", label: "Обновление политики" },
] as const;

const sectionClassName =
	"scroll-mt-32 rounded-md border border-hairline bg-canvas p-5 shadow-control sm:p-7 lg:p-8";

const listClassName = "mt-4 grid gap-2 pl-5 text-ink-muted marker:text-ink-faint";

export default function PrivacyPage() {
	return (
		<div className="relative flex min-h-dvh w-full flex-1 flex-col bg-canvas text-ink">
			<section
				aria-labelledby="privacy-title"
				className="mx-auto w-full max-w-6xl px-5 pb-16 pt-40 sm:px-8 sm:pb-20 sm:pt-44 lg:px-14 lg:pb-24 lg:pt-48">
				<div className="mx-auto max-w-4xl text-center">
					<div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-hairline bg-frost px-4 py-2 text-xs font-semibold text-ink-muted shadow-control">
						<ShieldCheck
							aria-hidden="true"
							className="size-4 text-ink"
							strokeWidth={1.8}
						/>
						Обновлено 28 июня 2026 года
					</div>

					<h1
						id="privacy-title"
						className="mt-6 text-4xl font-semibold tracking-normal text-ink sm:text-5xl lg:text-7xl">
						Политика конфиденциальности
					</h1>

					<p className="mx-auto mt-5 max-w-3xl text-base text-ink-muted sm:text-lg">
						Объясняем простым языком, какие данные получает Leppa &amp;
						WenSton, зачем они нужны и как пользователь может ими управлять.
					</p>
				</div>

				<div className="mt-12 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-8">
					<aside className="rounded-md border border-hairline bg-frost p-4 shadow-control lg:sticky lg:top-28">
						<h2 className="px-3 text-sm font-semibold text-ink">Содержание</h2>
						<nav
							aria-label="Разделы политики конфиденциальности"
							className="mt-3 grid gap-1">
							{policySections.map((section, index) => (
								<a
									key={section.id}
									href={`#${section.id}`}
									className="group flex min-h-10 items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-ink-splash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
									<span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas text-[11px] font-semibold text-ink-faint transition-colors group-hover:text-ink">
										{index + 1}
									</span>
									{section.label}
								</a>
							))}
						</nav>
					</aside>

					<article className="grid min-w-0 gap-4 text-[15px] leading-relaxed sm:text-base">
						<section
							id="general"
							className={sectionClassName}>
							<h2 className="text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
								1. Общие положения
							</h2>
							<div className="mt-4 grid gap-4 text-ink-muted">
								<p>
									Настоящая политика определяет порядок обработки и защиты
									персональных данных посетителей сайта и покупателей Leppa &amp;
									WenSton (далее — «Оператор»).
								</p>
								<p>
									Оператор обрабатывает персональные данные в соответствии с
									Конституцией Российской Федерации, Федеральным законом от
									27.07.2006 № 152-ФЗ «О персональных данных» и иными применимыми
									нормативными актами.
								</p>
							</div>

							<dl className="mt-6 grid gap-3 rounded-md border border-hairline bg-frost p-4 text-sm sm:grid-cols-[11rem_minmax(0,1fr)] sm:p-5">
								<dt className="font-semibold text-ink">Оператор</dt>
								<dd className="text-ink-muted">Leppa &amp; WenSton</dd>
								<dt className="font-semibold text-ink">Адрес</dt>
								<dd className="text-ink-muted">{contacts.address}</dd>
								<dt className="font-semibold text-ink">Email для обращений</dt>
								<dd>
									<a
										href={`mailto:${contacts.email}`}
										className="font-medium text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-ink-muted">
										{contacts.email}
									</a>
								</dd>
							</dl>
						</section>

						<section
							id="data"
							className={sectionClassName}>
							<h2 className="text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
								2. Какие данные обрабатываются
							</h2>
							<p className="mt-4 text-ink-muted">
								Состав данных зависит от того, как пользователь взаимодействует с
								сайтом.
							</p>
							<ul className={listClassName}>
								<li>
									при оформлении заказа физическим лицом: имя, фамилия, телефон,
									email, регион, город и комментарий;
								</li>
								<li>
									при оформлении заказа для организации или ИП: контактные данные
									представителя, наименование, ИНН, КПП, ОГРН, юридический адрес и
									банковские реквизиты;
								</li>
								<li>
									сведения о заказе: товары, выбранные характеристики, количество,
									стоимость, необходимость обратного звонка и адрес страницы
									отправки;
								</li>
								<li>
									технические сведения: IP-адрес, тип и версия браузера, user-agent,
									источник запроса, дата и время обращения, записи серверных журналов;
								</li>
								<li>
									данные корзины и избранного, которые сохраняются только в локальном
									хранилище браузера на устройстве пользователя.
								</li>
							</ul>
							<p className="mt-5 rounded-md border border-hairline bg-frost p-4 text-sm text-ink-muted">
								Сайт не запрашивает паспортные данные, сведения о здоровье,
								биометрические данные и данные банковских карт. Оплата на сайте в
								текущей версии не производится.
							</p>
						</section>

						<section
							id="purposes"
							className={sectionClassName}>
							<h2 className="text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
								3. Цели и правовые основания
							</h2>
							<ul className={listClassName}>
								<li>приём, подтверждение, комплектация и сопровождение заказов;</li>
								<li>связь с покупателем и ответы на его обращения;</li>
								<li>подготовка предложений, счетов и документов по заказу;</li>
								<li>обеспечение работы, безопасности и защиты сайта от злоупотреблений;</li>
								<li>исполнение обязанностей, установленных законодательством РФ.</li>
							</ul>
							<p className="mt-5 text-ink-muted">
								Основаниями обработки являются согласие пользователя, действия по
								его запросу до заключения договора, заключение и исполнение договора,
								а также выполнение обязанностей Оператора, предусмотренных законом.
								Отказ предоставить обязательные данные не позволяет оформить заказ,
								но не ограничивает просмотр каталога.
							</p>
						</section>

						<section
							id="processing"
							className={sectionClassName}>
							<h2 className="text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
								4. Порядок обработки
							</h2>
							<p className="mt-4 text-ink-muted">
								Оператор может собирать, записывать, систематизировать, накапливать,
								хранить, уточнять, извлекать, использовать, передавать уполномоченным
								лицам, блокировать и удалять данные с использованием средств
								автоматизации или без них.
							</p>
							<p className="mt-4 text-ink-muted">
								Доступ к данным получают только сотрудники и подрядчики, которым он
								необходим для выполнения конкретной задачи. Оператор не продаёт
								персональные данные и не передаёт их третьим лицам для самостоятельной
								рекламы.
							</p>
						</section>

						<section
							id="services"
							className={sectionClassName}>
							<h2 className="text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
								5. Сторонние сервисы и передача данных
							</h2>
							<p className="mt-4 text-ink-muted">
								Для работы сайта Оператор может привлекать поставщиков хостинга,
								системы управления каталогом и заказами, технической поддержки и
								электронной почты. Им передаётся только объём сведений, необходимый
								для оказания соответствующей услуги.
							</p>
							<p className="mt-4 text-ink-muted">
								На странице контактов встроена Яндекс Карта. При её открытии сервис
								Яндекса может получить технические данные пользователя и использовать
								собственные cookie в соответствии с его
								{" "}
								<a
									href="https://yandex.ru/legal/confidential/"
									target="_blank"
									rel="noreferrer"
									className="font-medium text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-ink-muted">
									политикой конфиденциальности
								</a>
								.
							</p>
							<p className="mt-4 text-ink-muted">
								Сведения могут быть раскрыты государственным органам, если это прямо
								предусмотрено законом. Трансграничная передача персональных данных
								не осуществляется без отдельного правового основания и выполнения
								установленных законом процедур.
							</p>
						</section>

						<section
							id="storage"
							className={sectionClassName}>
							<h2 className="text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
								6. Сроки хранения и защита
							</h2>
							<p className="mt-4 text-ink-muted">
								Данные хранятся не дольше, чем этого требуют цели обработки, договор
								с пользователем и обязательные сроки хранения документов по закону.
								После достижения целей данные удаляются или обезличиваются, если их
								дальнейшее хранение не требуется.
							</p>
							<p className="mt-4 text-ink-muted">
								Оператор применяет организационные и технические меры защиты: контроль
								доступа, ограничение прав пользователей информационных систем,
								резервное копирование, обновление программного обеспечения и
								мониторинг событий безопасности.
							</p>
						</section>

						<section
							id="rights"
							className={sectionClassName}>
							<h2 className="text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
								7. Права пользователя
							</h2>
							<p className="mt-4 text-ink-muted">Пользователь вправе:</p>
							<ul className={listClassName}>
								<li>получить сведения об обработке своих персональных данных;</li>
								<li>потребовать уточнения, блокирования или удаления данных;</li>
								<li>отозвать ранее данное согласие;</li>
								<li>обжаловать действия Оператора в Роскомнадзоре или суде.</li>
							</ul>
							<p className="mt-5 text-ink-muted">
								Для запроса напишите на
								{" "}
								<a
									href={`mailto:${contacts.email}?subject=${encodeURIComponent("Персональные данные")}`}
									className="font-medium text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-ink-muted">
									{contacts.email}
								</a>
								{" "}
								с темой «Персональные данные». Для защиты от неправомерного доступа
								Оператор может запросить сведения, позволяющие подтвердить личность
								заявителя и его связь с данными.
							</p>
						</section>

						<section
							id="updates"
							className="scroll-mt-32 rounded-md border border-ink bg-ink p-5 text-on-dark shadow-surface-lg sm:p-7 lg:p-8">
							<h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">
								8. Обновление политики
							</h2>
							<p className="mt-4 text-on-dark/70">
								Оператор может обновлять политику при изменении сайта, состава
								сервисов или требований законодательства. Новая редакция действует
								с момента публикации на этой странице, если в ней не указано иное.
							</p>
							<div className="mt-6 flex flex-wrap gap-3">
								<Link
									href="/contact"
									className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-control transition-transform hover:-translate-y-0.5">
									Связаться с нами
								</Link>
								<Link
									href="/"
									className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-on-dark transition-colors hover:bg-white/10">
									На главную
								</Link>
							</div>
						</section>
					</article>
				</div>
			</section>
		</div>
	);
}

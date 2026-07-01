import type { Core } from '@strapi/strapi';

const PUBLIC_API_ACTIONS = {
  'api::category.category': ['find', 'findOne'],
  'api::color.color': ['find', 'findOne'],
  'api::home-page.home-page': ['find'],
  'api::product-bundle.product-bundle': ['find', 'findOne'],
  'api::product.product': ['find', 'findOne'],
  'api::site-setting.site-setting': ['find'],
} as const;

type EditorField = { name: string; size: number };
type EditorConfiguration = {
  layouts: {
    edit: EditorField[][];
    [key: string]: unknown;
  };
  metadatas: Record<string, {
    edit?: Record<string, unknown>;
    list?: Record<string, unknown>;
  }>;
  settings: Record<string, unknown>;
};

type ContentTypeEditorService = {
  findContentType(uid: string): unknown;
  findConfiguration(contentType: unknown): Promise<EditorConfiguration & { uid: string }>;
  updateConfiguration(
    contentType: unknown,
    configuration: EditorConfiguration,
  ): Promise<unknown>;
};

const EDITOR_LABELS: Record<string, Record<string, string>> = {
  'api::product.product': {
    slug: 'Адрес страницы',
    sku: 'Артикул',
    baseSku: 'Базовый артикул',
    color: 'Цвет',
    name: 'Название',
    brand: 'Бренд',
    price: 'Цена',
    description: 'Описание',
    specifications: 'Характеристики',
    images: 'Фотографии',
    videos: 'Видео',
    inStock: 'В наличии',
    category: 'Категория',
  },
  'api::product-bundle.product-bundle': {
    title: 'Название комплекта',
    enabled: 'Показывать на сайте',
    discountPercent: 'Скидка, %',
    products: 'Товары комплекта',
  },
  'api::home-page.home-page': {
    heroTitle: 'Главный заголовок',
    heroDescription: 'Текст главного экрана',
    heroButtonLabel: 'Текст кнопки главного экрана',
    heroButtonHref: 'Ссылка кнопки главного экрана',
    heroImage: 'Фоновое изображение главного экрана',
    categoriesTitle: 'Заголовок категорий',
    categoriesDescription: 'Описание категорий',
    aboutSections: 'Разделы «О нас»',
    benefitsTitle: 'Заголовок преимуществ',
    benefitsDescription: 'Описание преимуществ',
    benefits: 'Преимущества',
    ctaTitle: 'Заголовок блока связи',
    ctaDescription: 'Описание блока связи',
    ctaPhoneLabel: 'Текст кнопки звонка',
    ctaMessengerLabel: 'Текст кнопки мессенджера',
  },
  'api::site-setting.site-setting': {
    companyName: 'Название компании',
    footerDescription: 'Описание в подвале сайта',
    contactTitle: 'Заголовок страницы контактов',
    contactDescription: 'Описание страницы контактов',
    phone: 'Телефон',
    email: 'Email',
    messengers: 'Мессенджеры',
    address: 'Адрес',
    hours: 'Время работы',
    mapEmbed: 'Ссылка для встраивания карты',
    mapLink: 'Ссылка на карту',
  },
};

async function configureContentManager(strapi: Core.Strapi) {
  const editorService = strapi
    .plugin('content-manager')
    .service('content-types') as ContentTypeEditorService;

  for (const [uid, labels] of Object.entries(EDITOR_LABELS)) {
    const contentType = editorService.findContentType(uid);

    if (!contentType) {
      continue;
    }

    const { uid: _configurationUid, ...configuration } =
      await editorService.findConfiguration(contentType);

    for (const [fieldName, label] of Object.entries(labels)) {
      const metadata = configuration.metadatas[fieldName];

      if (metadata?.edit) {
        metadata.edit.label = label;
      }
    }

    if (uid === 'api::product.product') {
      const hiddenFields = new Set([
        'attributes',
        'bundles',
        'bundleEnabled',
        'bundleDiscountPercent',
        'bundleProducts',
      ]);
      let hasSpecifications = false;
      const editLayout = configuration.layouts.edit
        .map((row) => row.filter((field) => {
          if (field.name === 'specifications') {
            hasSpecifications = true;
          }

          return !hiddenFields.has(field.name);
        }))
        .filter((row) => row.length > 0);

      if (!hasSpecifications) {
        editLayout.push([{ name: 'specifications', size: 12 }]);
      }

      configuration.layouts.edit = editLayout;
    }

    await editorService.updateConfiguration(contentType, configuration);
  }
}

async function ensurePublicApiPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    return;
  }

  for (const [uid, actions] of Object.entries(PUBLIC_API_ACTIONS)) {
    for (const action of actions) {
      const permissionAction = `${uid}.${action}`;
      const permissionExists = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({
          where: {
            action: permissionAction,
            role: publicRole.id,
          },
        });

      if (!permissionExists) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: {
            action: permissionAction,
            role: publicRole.id,
          },
        });
      }
    }
  }
}

export default {
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensurePublicApiPermissions(strapi);
    await configureContentManager(strapi);
  },
};

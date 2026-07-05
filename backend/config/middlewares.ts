import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://leppa-wenston.ru',
        'https://www.leppa-wenston.ru',
        'https://xn----7sbhm0aqahda1am8k.xn--p1ai',
        'https://leppa-wenston.vercel.app',
      ],
      credentials: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  {
    name: 'strapi::public',
    config: {
      maxAge: 31_536_000_000,
    },
  },
];

export default config;

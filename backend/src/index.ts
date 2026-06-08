import type { Core } from '@strapi/strapi';

const COLOR_UID = 'api::color.color';
const PUBLIC_COLOR_ACTIONS = ['find', 'findOne'] as const;

async function ensurePublicColorPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    return;
  }

  for (const action of PUBLIC_COLOR_ACTIONS) {
    const permissionExists = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({
        where: {
          action: `api::color.color.${action}`,
          role: publicRole.id,
        },
      });

    if (!permissionExists) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::color.color.${action}`,
          role: publicRole.id,
        },
      });
    }
  }
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensurePublicColorPermissions(strapi);
  },
};

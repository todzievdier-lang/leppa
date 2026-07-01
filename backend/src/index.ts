import type { Core } from '@strapi/strapi';

const PUBLIC_API_ACTIONS = {
  'api::category.category': ['find', 'findOne'],
  'api::color.color': ['find', 'findOne'],
  'api::product.product': ['find', 'findOne'],
} as const;

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
  },
};

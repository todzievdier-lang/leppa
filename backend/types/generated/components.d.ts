import type { Schema, Struct } from '@strapi/strapi';

export interface CommonMessenger extends Struct.ComponentSchema {
  collectionName: 'components_common_messengers';
  info: {
    description: '\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 WhatsApp, Telegram \u0438\u043B\u0438 \u0434\u0440\u0443\u0433\u043E\u0439 \u043C\u0435\u0441\u0441\u0435\u043D\u0434\u0436\u0435\u0440';
    displayName: '\u041C\u0435\u0441\u0441\u0435\u043D\u0434\u0436\u0435\u0440';
  };
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CommonWorkingHour extends Struct.ComponentSchema {
  collectionName: 'components_common_working_hours';
  info: {
    displayName: '\u0412\u0440\u0435\u043C\u044F \u0440\u0430\u0431\u043E\u0442\u044B';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomeAboutSection extends Struct.ComponentSchema {
  collectionName: 'components_home_about_sections';
  info: {
    displayName: '\u0420\u0430\u0437\u0434\u0435\u043B \u00AB\u041E \u043D\u0430\u0441\u00BB';
  };
  attributes: {
    body: Schema.Attribute.Text & Schema.Attribute.Required;
    order: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomeBenefit extends Struct.ComponentSchema {
  collectionName: 'components_home_benefits';
  info: {
    displayName: '\u041F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u043E';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<
      ['quality', 'support', 'price', 'delivery']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'quality'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ProductSpecification extends Struct.ComponentSchema {
  collectionName: 'components_product_specifications';
  info: {
    description: '\u041E\u0434\u043D\u0430 \u043F\u043E\u043D\u044F\u0442\u043D\u0430\u044F \u0445\u0430\u0440\u0430\u043A\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043A\u0430 \u0442\u043E\u0432\u0430\u0440\u0430';
    displayName: '\u0425\u0430\u0440\u0430\u043A\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043A\u0430';
    icon: 'bulletList';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    unit: Schema.Attribute.String;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'common.messenger': CommonMessenger;
      'common.working-hour': CommonWorkingHour;
      'home.about-section': HomeAboutSection;
      'home.benefit': HomeBenefit;
      'product.specification': ProductSpecification;
    }
  }
}

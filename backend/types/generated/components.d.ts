import type { Schema, Attribute } from '@strapi/strapi';

export interface StatusStatusChange extends Schema.Component {
  collectionName: 'components_status_status_changes';
  info: {
    displayName: 'StatusChange';
    description: '';
  };
  attributes: {
    from: Attribute.String;
    to: Attribute.String & Attribute.Required;
    date: Attribute.DateTime;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'status.status-change': StatusStatusChange;
    }
  }
}

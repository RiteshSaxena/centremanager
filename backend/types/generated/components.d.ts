import type { Schema, Attribute } from '@strapi/strapi';

export interface GuestGuest extends Schema.Component {
  collectionName: 'components_guest_guests';
  info: {
    displayName: 'Guest';
  };
  attributes: {
    firstName: Attribute.String & Attribute.Required;
    lastName: Attribute.String;
    phoneNumber: Attribute.String;
    email: Attribute.Email;
  };
}

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
      'guest.guest': GuestGuest;
      'status.status-change': StatusStatusChange;
    }
  }
}

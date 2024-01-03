import type { Schema, Attribute } from '@strapi/strapi';

export interface AccountingZohoBooks extends Schema.Component {
  collectionName: 'components_accounting_zoho_books';
  info: {
    displayName: 'ZohoBooks';
    icon: 'book';
    description: '';
  };
  attributes: {
    clientId: Attribute.String & Attribute.Required;
    clientSecret: Attribute.String & Attribute.Required;
    accessToken: Attribute.String & Attribute.Required;
    refreshToken: Attribute.String & Attribute.Required;
    domain: Attribute.String & Attribute.Required;
    organizationId: Attribute.String & Attribute.Required;
  };
}

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
      'accounting.zoho-books': AccountingZohoBooks;
      'guest.guest': GuestGuest;
      'status.status-change': StatusStatusChange;
    }
  }
}

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
    enabled: Attribute.Boolean & Attribute.Required & Attribute.DefaultTo<true>;
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

export interface SubscriptionSubscription extends Schema.Component {
  collectionName: 'components_subscription_subscriptions';
  info: {
    displayName: 'Subscription';
    description: '';
  };
  attributes: {
    status: Attribute.Enumeration<['paid', 'trial', 'free', 'inactive']>;
    trialExpiryDate: Attribute.DateTime;
    transactions: Attribute.Component<'subscription.transaction', true>;
    freePlanLimit: Attribute.Integer & Attribute.DefaultTo<10>;
  };
}

export interface SubscriptionTransaction extends Schema.Component {
  collectionName: 'components_subscription_transactions';
  info: {
    displayName: 'Transaction';
  };
  attributes: {
    customerId: Attribute.String & Attribute.Required;
    status: Attribute.Enumeration<['pending', 'completed', 'expired']>;
    sessionId: Attribute.String & Attribute.Required;
    updatedDate: Attribute.DateTime;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'accounting.zoho-books': AccountingZohoBooks;
      'guest.guest': GuestGuest;
      'status.status-change': StatusStatusChange;
      'subscription.subscription': SubscriptionSubscription;
      'subscription.transaction': SubscriptionTransaction;
    }
  }
}

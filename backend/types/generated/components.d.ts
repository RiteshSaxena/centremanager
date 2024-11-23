import type { Attribute, Schema } from '@strapi/strapi';

export interface AccountingZohoBooks extends Schema.Component {
  collectionName: 'components_accounting_zoho_books';
  info: {
    description: '';
    displayName: 'ZohoBooks';
    icon: 'book';
  };
  attributes: {
    accessToken: Attribute.String & Attribute.Required;
    clientId: Attribute.String & Attribute.Required;
    clientSecret: Attribute.String & Attribute.Required;
    domain: Attribute.String & Attribute.Required;
    enabled: Attribute.Boolean & Attribute.Required & Attribute.DefaultTo<true>;
    organizationId: Attribute.String & Attribute.Required;
    refreshToken: Attribute.String & Attribute.Required;
  };
}

export interface GuestGuest extends Schema.Component {
  collectionName: 'components_guest_guests';
  info: {
    displayName: 'Guest';
  };
  attributes: {
    email: Attribute.Email;
    firstName: Attribute.String & Attribute.Required;
    lastName: Attribute.String;
    phoneNumber: Attribute.String;
  };
}

export interface StatusStatusChange extends Schema.Component {
  collectionName: 'components_status_status_changes';
  info: {
    description: '';
    displayName: 'StatusChange';
  };
  attributes: {
    date: Attribute.DateTime;
    from: Attribute.String;
    to: Attribute.String & Attribute.Required;
  };
}

export interface SubscriptionSubscription extends Schema.Component {
  collectionName: 'components_subscription_subscriptions';
  info: {
    description: '';
    displayName: 'Subscription';
  };
  attributes: {
    freePlanLimit: Attribute.Integer & Attribute.DefaultTo<10>;
    status: Attribute.Enumeration<['paid', 'trial', 'free', 'inactive']>;
    transactions: Attribute.Component<'subscription.transaction', true>;
    trialExpiryDate: Attribute.DateTime;
  };
}

export interface SubscriptionTransaction extends Schema.Component {
  collectionName: 'components_subscription_transactions';
  info: {
    displayName: 'Transaction';
  };
  attributes: {
    customerId: Attribute.String & Attribute.Required;
    sessionId: Attribute.String & Attribute.Required;
    status: Attribute.Enumeration<['pending', 'completed', 'expired']>;
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

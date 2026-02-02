import type { Schema, Struct } from '@strapi/strapi';

export interface AccountingZohoBooks extends Struct.ComponentSchema {
  collectionName: 'components_accounting_zoho_books';
  info: {
    description: '';
    displayName: 'ZohoBooks';
    icon: 'book';
  };
  attributes: {
    accessToken: Schema.Attribute.String & Schema.Attribute.Required;
    clientId: Schema.Attribute.String & Schema.Attribute.Required;
    clientSecret: Schema.Attribute.String & Schema.Attribute.Required;
    domain: Schema.Attribute.String & Schema.Attribute.Required;
    organizationId: Schema.Attribute.String & Schema.Attribute.Required;
    refreshToken: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface GuestGuest extends Struct.ComponentSchema {
  collectionName: 'components_guest_guests';
  info: {
    displayName: 'Guest';
  };
  attributes: {
    email: Schema.Attribute.Email;
    firstName: Schema.Attribute.String & Schema.Attribute.Required;
    lastName: Schema.Attribute.String;
    phoneNumber: Schema.Attribute.String;
  };
}

export interface StatusStatusChange extends Struct.ComponentSchema {
  collectionName: 'components_status_status_changes';
  info: {
    description: '';
    displayName: 'StatusChange';
  };
  attributes: {
    date: Schema.Attribute.DateTime;
    from: Schema.Attribute.String;
    to: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SubscriptionSubscription extends Struct.ComponentSchema {
  collectionName: 'components_subscription_subscriptions';
  info: {
    description: '';
    displayName: 'Subscription';
  };
  attributes: {
    freePlanLimit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    status: Schema.Attribute.Enumeration<['paid', 'trial', 'free', 'inactive']>;
    transactions: Schema.Attribute.Component<'subscription.transaction', true>;
    trialExpiryDate: Schema.Attribute.DateTime;
  };
}

export interface SubscriptionTransaction extends Struct.ComponentSchema {
  collectionName: 'components_subscription_transactions';
  info: {
    displayName: 'Transaction';
  };
  attributes: {
    customerId: Schema.Attribute.String & Schema.Attribute.Required;
    sessionId: Schema.Attribute.String & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['pending', 'completed', 'expired']>;
    updatedDate: Schema.Attribute.DateTime;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'accounting.zoho-books': AccountingZohoBooks;
      'guest.guest': GuestGuest;
      'status.status-change': StatusStatusChange;
      'subscription.subscription': SubscriptionSubscription;
      'subscription.transaction': SubscriptionTransaction;
    }
  }
}

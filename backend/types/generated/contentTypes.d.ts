import type { Attribute, Schema } from '@strapi/strapi';

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::api-token', 'oneToOne', 'admin::user'> & Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<'admin::api-token', 'oneToMany', 'admin::api-token-permission'>;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::api-token', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::api-token-permission', 'oneToOne', 'admin::user'> & Attribute.Private;
    token: Attribute.Relation<'admin::api-token-permission', 'manyToOne', 'admin::api-token'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::api-token-permission', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::permission', 'oneToOne', 'admin::user'> & Attribute.Private;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::permission', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> & Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<'admin::role', 'oneToMany', 'admin::permission'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> & Attribute.Private;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::transfer-token', 'oneToOne', 'admin::user'> & Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<'admin::transfer-token', 'oneToMany', 'admin::transfer-token-permission'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::transfer-token', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::transfer-token-permission', 'oneToOne', 'admin::user'> & Attribute.Private;
    token: Attribute.Relation<'admin::transfer-token-permission', 'manyToOne', 'admin::transfer-token'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::transfer-token-permission', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> & Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Attribute.String;
    registrationToken: Attribute.String & Attribute.Private;
    resetPasswordToken: Attribute.String & Attribute.Private;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> & Attribute.Private;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> & Attribute.Private;
    username: Attribute.String;
  };
}

export interface ApiCenterCenter extends Schema.CollectionType {
  collectionName: 'centers';
  info: {
    description: '';
    displayName: 'Center';
    pluralName: 'centers';
    singularName: 'center';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::center.center', 'oneToOne', 'admin::user'> & Attribute.Private;
    defaultDueAmount: Attribute.Decimal;
    defaultPaymentDate: Attribute.Integer &
      Attribute.SetMinMax<
        {
          max: 31;
          min: 1;
        },
        number
      > &
      Attribute.DefaultTo<1>;
    displayName: Attribute.String;
    lastImportDate: Attribute.DateTime;
    logo: Attribute.Media<'images'>;
    name: Attribute.String & Attribute.Required & Attribute.Unique;
    paymentHandler: Attribute.Enumeration<['none', 'inbuilt', 'zohobooks']>;
    region: Attribute.String;
    subscription: Attribute.Component<'subscription.subscription'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::center.center', 'oneToOne', 'admin::user'> & Attribute.Private;
    zohobooks: Attribute.Component<'accounting.zoho-books'>;
  };
}

export interface ApiChildChild extends Schema.CollectionType {
  collectionName: 'children';
  info: {
    description: '';
    displayName: 'Child';
    pluralName: 'children';
    singularName: 'child';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    center: Attribute.Relation<'api::child.child', 'oneToOne', 'api::center.center'>;
    childHash: Attribute.String & Attribute.Unique;
    city: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::child.child', 'oneToOne', 'admin::user'> & Attribute.Private;
    dueAmount: Attribute.Decimal;
    enquiryDate: Attribute.DateTime;
    enrollmentDate: Attribute.DateTime;
    firstName: Attribute.String & Attribute.Required;
    formType: Attribute.String;
    gender: Attribute.Enumeration<['Male', 'Female', 'Others']>;
    houseNumber: Attribute.String;
    isDue: Attribute.Boolean & Attribute.DefaultTo<false>;
    isEarlyLearner: Attribute.Boolean & Attribute.DefaultTo<false>;
    lastName: Attribute.String;
    notes: Attribute.Text;
    parents: Attribute.Relation<'api::child.child', 'manyToMany', 'api::parent.parent'>;
    paymentAmount: Attribute.Decimal;
    paymentDate: Attribute.Integer;
    postcode: Attribute.String;
    referralCode: Attribute.String;
    school: Attribute.Relation<'api::child.child', 'oneToOne', 'api::school.school'>;
    schoolYear: Attribute.String;
    slots: Attribute.Relation<'api::child.child', 'manyToMany', 'api::slot.slot'>;
    status: Attribute.Enumeration<
      [
        'New',
        'No Further Contact',
        'Future Follow Up',
        'Enrolment meeting no show',
        "Attended enrolment meeting but didn't enrol",
        'Send to KSiS',
        'Send to KSiS (Free Trial)',
        'Exited'
      ]
    > &
      Attribute.DefaultTo<'New'>;
    statusLog: Attribute.Component<'status.status-change', true>;
    streetName: Attribute.String;
    subjects: Attribute.Relation<'api::child.child', 'oneToMany', 'api::subject.subject'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::child.child', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface ApiFeedbackFeedback extends Schema.CollectionType {
  collectionName: 'feedbacks';
  info: {
    description: '';
    displayName: 'Feedback';
    pluralName: 'feedbacks';
    singularName: 'feedback';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    child: Attribute.Relation<'api::feedback.feedback', 'oneToOne', 'api::child.child'>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::feedback.feedback', 'oneToOne', 'admin::user'> & Attribute.Private;
    createdByUser: Attribute.Relation<'api::feedback.feedback', 'oneToOne', 'plugin::users-permissions.user'>;
    createdDate: Attribute.Date;
    englishScore: Attribute.Decimal & Attribute.Required;
    englishTime: Attribute.BigInteger & Attribute.Required;
    feedback: Attribute.Text;
    isPercentFeedbackRequired: Attribute.Boolean;
    mathScore: Attribute.Decimal & Attribute.Required;
    mathTime: Attribute.BigInteger & Attribute.Required;
    publishedAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::feedback.feedback', 'oneToOne', 'admin::user'> & Attribute.Private;
    updatedByUser: Attribute.Relation<'api::feedback.feedback', 'oneToOne', 'plugin::users-permissions.user'>;
  };
}

export interface ApiInviteCodeInviteCode extends Schema.CollectionType {
  collectionName: 'invite_codes';
  info: {
    description: '';
    displayName: 'InviteCode';
    pluralName: 'invite-codes';
    singularName: 'invite-code';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    active: Attribute.Boolean & Attribute.Required & Attribute.DefaultTo<true>;
    code: Attribute.UID<
      undefined,
      undefined,
      {
        'uuid-format': '^[a-z0-9]{6}$';
      }
    > &
      Attribute.CustomField<
        'plugin::strapi-advanced-uuid.uuid',
        {
          'uuid-format': '^[a-z0-9]{6}$';
        }
      >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::invite-code.invite-code', 'oneToOne', 'admin::user'> & Attribute.Private;
    isUsed: Attribute.Boolean & Attribute.DefaultTo<false>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::invite-code.invite-code', 'oneToOne', 'admin::user'> & Attribute.Private;
    usedBy: Attribute.Relation<'api::invite-code.invite-code', 'oneToOne', 'api::center.center'>;
  };
}

export interface ApiLogBookLogBook extends Schema.CollectionType {
  collectionName: 'log_books';
  info: {
    description: '';
    displayName: 'LogBook';
    pluralName: 'log-books';
    singularName: 'log-book';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    center: Attribute.Relation<'api::log-book.log-book', 'oneToOne', 'api::center.center'>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::log-book.log-book', 'oneToOne', 'admin::user'> & Attribute.Private;
    guest: Attribute.Component<'guest.guest'>;
    parent: Attribute.Relation<'api::log-book.log-book', 'oneToOne', 'api::parent.parent'>;
    signatureIn: Attribute.Media<'images'>;
    signatureOut: Attribute.Media<'images'>;
    signInTime: Attribute.DateTime;
    signOutTime: Attribute.DateTime;
    staff: Attribute.Relation<'api::log-book.log-book', 'oneToOne', 'plugin::users-permissions.user'>;
    student: Attribute.Relation<'api::log-book.log-book', 'oneToOne', 'api::child.child'>;
    type: Attribute.Enumeration<['Staff', 'Guest', 'Student', 'StudentWithParent', 'Parent']>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::log-book.log-book', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface ApiParentParent extends Schema.CollectionType {
  collectionName: 'parents';
  info: {
    description: '';
    displayName: 'Parent';
    pluralName: 'parents';
    singularName: 'parent';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    center: Attribute.Relation<'api::parent.parent', 'oneToOne', 'api::center.center'>;
    children: Attribute.Relation<'api::parent.parent', 'manyToMany', 'api::child.child'>;
    contactNumber: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::parent.parent', 'oneToOne', 'admin::user'> & Attribute.Private;
    email: Attribute.Email;
    firstName: Attribute.String & Attribute.Required;
    lastName: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::parent.parent', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface ApiPaymentPayment extends Schema.CollectionType {
  collectionName: 'payments';
  info: {
    description: '';
    displayName: 'Payment';
    pluralName: 'payments';
    singularName: 'payment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amount: Attribute.Decimal & Attribute.Required;
    center: Attribute.Relation<'api::payment.payment', 'oneToOne', 'api::center.center'>;
    child: Attribute.Relation<'api::payment.payment', 'oneToOne', 'api::child.child'>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::payment.payment', 'oneToOne', 'admin::user'> & Attribute.Private;
    notes: Attribute.String;
    paymentDate: Attribute.Date & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::payment.payment', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface ApiSchoolSchool extends Schema.CollectionType {
  collectionName: 'schools';
  info: {
    displayName: 'School';
    pluralName: 'schools';
    singularName: 'school';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    city: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::school.school', 'oneToOne', 'admin::user'> & Attribute.Private;
    name: Attribute.String & Attribute.Required;
    postcode: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::school.school', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface ApiSlotSlot extends Schema.CollectionType {
  collectionName: 'slots';
  info: {
    description: '';
    displayName: 'Slot';
    pluralName: 'slots';
    singularName: 'slot';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    center: Attribute.Relation<'api::slot.slot', 'oneToOne', 'api::center.center'>;
    children: Attribute.Relation<'api::slot.slot', 'manyToMany', 'api::child.child'>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::slot.slot', 'oneToOne', 'admin::user'> & Attribute.Private;
    day: Attribute.Enumeration<['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']>;
    endTime: Attribute.Time;
    name: Attribute.String;
    startTime: Attribute.Time;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::slot.slot', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface ApiSubjectSubject extends Schema.CollectionType {
  collectionName: 'subjects';
  info: {
    displayName: 'Subject';
    pluralName: 'subjects';
    singularName: 'subject';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::subject.subject', 'oneToOne', 'admin::user'> & Attribute.Private;
    name: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::subject.subject', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::content-releases.release', 'oneToOne', 'admin::user'> & Attribute.Private;
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    status: Attribute.Enumeration<['ready', 'blocked', 'failed', 'done', 'empty']> & Attribute.Required;
    timezone: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'plugin::content-releases.release', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::content-releases.release-action', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    entry: Attribute.Relation<'plugin::content-releases.release-action', 'morphToOne'>;
    isEntryValid: Attribute.Boolean;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'plugin::content-releases.release-action', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::i18n.locale', 'oneToOne', 'admin::user'> & Attribute.Private;
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'plugin::i18n.locale', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Attribute.String;
    caption: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::upload.file', 'oneToOne', 'admin::user'> & Attribute.Private;
    ext: Attribute.String;
    folder: Attribute.Relation<'plugin::upload.file', 'manyToOne', 'plugin::upload.folder'> & Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    height: Attribute.Integer;
    mime: Attribute.String & Attribute.Required;
    name: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    size: Attribute.Decimal & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'plugin::upload.file', 'oneToOne', 'admin::user'> & Attribute.Private;
    url: Attribute.String & Attribute.Required;
    width: Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Attribute.Relation<'plugin::upload.folder', 'oneToMany', 'plugin::upload.folder'>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::upload.folder', 'oneToOne', 'admin::user'> & Attribute.Private;
    files: Attribute.Relation<'plugin::upload.folder', 'oneToMany', 'plugin::upload.file'>;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    parent: Attribute.Relation<'plugin::upload.folder', 'manyToOne', 'plugin::upload.folder'>;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'plugin::upload.folder', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::users-permissions.permission', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    role: Attribute.Relation<'plugin::users-permissions.permission', 'manyToOne', 'plugin::users-permissions.role'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'plugin::users-permissions.permission', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::users-permissions.role', 'oneToOne', 'admin::user'> & Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    type: Attribute.String & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'plugin::users-permissions.role', 'oneToOne', 'admin::user'> & Attribute.Private;
    users: Attribute.Relation<'plugin::users-permissions.role', 'oneToMany', 'plugin::users-permissions.user'>;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    center: Attribute.Relation<'plugin::users-permissions.user', 'oneToOne', 'api::center.center'>;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::users-permissions.user', 'oneToOne', 'admin::user'> & Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstName: Attribute.String & Attribute.Required;
    lastName: Attribute.String;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    phoneNumber: Attribute.String;
    provider: Attribute.String;
    resetPasswordToken: Attribute.String & Attribute.Private;
    role: Attribute.Relation<'plugin::users-permissions.user', 'manyToOne', 'plugin::users-permissions.role'>;
    type: Attribute.Enumeration<['admin', 'staff']> & Attribute.DefaultTo<'admin'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'plugin::users-permissions.user', 'oneToOne', 'admin::user'> & Attribute.Private;
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::center.center': ApiCenterCenter;
      'api::child.child': ApiChildChild;
      'api::feedback.feedback': ApiFeedbackFeedback;
      'api::invite-code.invite-code': ApiInviteCodeInviteCode;
      'api::log-book.log-book': ApiLogBookLogBook;
      'api::parent.parent': ApiParentParent;
      'api::payment.payment': ApiPaymentPayment;
      'api::school.school': ApiSchoolSchool;
      'api::slot.slot': ApiSlotSlot;
      'api::subject.subject': ApiSubjectSubject;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}

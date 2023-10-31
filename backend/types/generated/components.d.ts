import type { Schema, Attribute } from '@strapi/strapi';

export interface SlotSlotTimings extends Schema.Component {
  collectionName: 'components_slot_slot_timings';
  info: {
    displayName: 'SlotTimings';
    description: '';
  };
  attributes: {
    day: Attribute.Enumeration<['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']> &
      Attribute.Required;
    startTime: Attribute.Time & Attribute.Required;
    endTime: Attribute.Time & Attribute.Required;
  };
}

export interface StatusStatusChange extends Schema.Component {
  collectionName: 'components_status_status_changes';
  info: {
    displayName: 'StatusChange';
  };
  attributes: {
    from: Attribute.String & Attribute.Required;
    to: Attribute.String & Attribute.Required;
    date: Attribute.DateTime;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'slot.slot-timings': SlotSlotTimings;
      'status.status-change': StatusStatusChange;
    }
  }
}

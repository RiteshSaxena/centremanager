/**
 * slot controller
 */

import { factories } from '@strapi/strapi';
import utils from '@strapi/utils';
import { sanitizeChild } from '../../../utils/sanitize';
import schema from '../schema';

const { ValidationError } = utils.errors;

export default factories.createCoreController('api::slot.slot', ({ strapi }) => ({
  async find(ctx) {
    const slots = await strapi.documents('api::slot.slot').findMany({
      filters: {
        center: {
          id: ctx.state.center.id,
        },
      },
      populate: ['children'],
      sort: ['day:asc', 'startTime:asc'],
    });

    return slots.map((slot) => ({
      ...slot,
      children: slot.children.map((child) => sanitizeChild(child)),
    }));
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const center = ctx.state.center;

    const slot = await strapi.documents('api::slot.slot').findFirst({
      filters: { id },
      populate: ['center', 'children'],
    });

    if (!slot) {
      throw new ValidationError('Slot not found');
    }

    if (slot.center?.id !== center.id) {
      throw new ValidationError('Slot not found');
    }

    return {
      ...slot,
      children: slot.children.map((child) => sanitizeChild(child)),
    };
  },

  async create(ctx) {
    const payload = await schema.createSlot(ctx.request.body);
    const center = ctx.state.center;

    const newSlot = await strapi.documents('api::slot.slot').create({
      data: {
        ...payload,
        center: center.id,
      },
    });

    return newSlot;
  },

  async update(ctx) {
    const { id } = ctx.params;
    const payload = await schema.updateSlot(ctx.request.body);
    const center = ctx.state.center;

    // Verify slot exists and belongs to center
    const existingSlot = await strapi.documents('api::slot.slot').findFirst({
      filters: { id },
      populate: ['center'],
    });

    if (!existingSlot) {
      throw new ValidationError('Slot not found');
    }

    if (existingSlot.center?.id !== center.id) {
      throw new ValidationError('Slot not found');
    }

    const updatedSlot = await strapi.documents('api::slot.slot').update({
      documentId: existingSlot.documentId,
      data: payload,
    });

    return updatedSlot;
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const center = ctx.state.center;

    // Verify slot exists and belongs to center
    const existingSlot = await strapi.documents('api::slot.slot').findFirst({
      filters: { id },
      populate: ['center'],
    });

    if (!existingSlot) {
      throw new ValidationError('Slot not found');
    }

    if (existingSlot.center?.id !== center.id) {
      throw new ValidationError('Slot not found');
    }

    await strapi.documents('api::slot.slot').delete({
      documentId: existingSlot.documentId,
    });

    return { success: true };
  },
}));

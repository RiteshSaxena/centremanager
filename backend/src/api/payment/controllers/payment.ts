/**
 * payment controller
 */

import { factories } from '@strapi/strapi';
import utils from '@strapi/utils';
import moment from 'moment';

import schema from '../schema';

const { ValidationError } = utils.errors;

export default factories.createCoreController('api::payment.payment', ({ strapi }) => ({
  async find(ctx) {
    const childId = parseInt(ctx.query.child);

    const filters: any = {
      center: ctx.state.center.id,
    };

    if (childId) {
      const child = await strapi.entityService.findMany('api::child.child', {
        filters: {
          id: childId,
          center: ctx.state.center.id,
        },
        limit: 1,
      });

      if (!child.length) {
        throw new ValidationError('Child not found');
      }
      filters.child = childId;
      console.log('child', filters);
    }

    return await strapi.entityService.findMany('api::payment.payment', {
      filters,
      populate: ['child'],
      sort: 'paymentDate:desc',
    });
  },
  async create(ctx) {
    const payload = await schema.addPayment(ctx.request.body);

    const paymentDate = moment(payload.paymentDate, 'YYYY-MM-DD', true);

    if (!paymentDate.isValid()) {
      throw new ValidationError('Invalid payment date');
    }

    const child = await strapi.entityService.findMany('api::child.child', {
      filters: {
        id: payload.child,
        center: ctx.state.center.id,
      },
      limit: 1,
    });

    if (!child.length) {
      throw new ValidationError('Child not found');
    }

    await strapi.entityService.create('api::payment.payment', {
      data: {
        center: ctx.state.center.id,
        amount: payload.amount,
        child: payload.child,
        paymentDate: payload.paymentDate,
        notes: payload.notes,
      },
    });

    const c = child[0];

    if (c.isDue && !c.dueAmount) {
      await strapi.entityService.update('api::child.child', c.id, {
        data: {
          isDue: false,
          dueAmount: null,
        },
      });
    } else if (c.dueAmount && c.dueAmount > 0) {
      if (payload.amount >= c.dueAmount) {
        await strapi.entityService.update('api::child.child', c.id, {
          data: {
            isDue: false,
            dueAmount: null,
          },
        });
      } else {
        await strapi.entityService.update('api::child.child', c.id, {
          data: {
            isDue: true,
            dueAmount: c.dueAmount - payload.amount,
          },
        });
      }
    }

    return {
      message: 'Payment added successfully',
    };
  },
}));

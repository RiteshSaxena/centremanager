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
    const childId = parseInt(ctx.query.child as string);

    const filters: any = {
      center: {
        id: ctx.state.center.id,
      },
    };

    if (childId) {
      const child = await strapi.documents('api::child.child').findMany({
        filters: {
          id: childId,
          center: {
            id: ctx.state.center.id,
          },
        },
        limit: 1,
      });

      if (!child.length) {
        throw new ValidationError('Child not found');
      }
      filters.child = {
        id: childId,
      };
    }

    return await strapi.documents('api::payment.payment').findMany({
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

    const child = await strapi.documents('api::child.child').findMany({
      filters: {
        id: payload.child,
        center: {
          id: ctx.state.center.id,
        },
      },
      limit: 1,
    });

    if (!child.length) {
      throw new ValidationError('Child not found');
    }

    await strapi.documents('api::payment.payment').create({
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
      await strapi.documents('api::child.child').update({
        documentId: c.documentId,
        data: {
          isDue: false,
          dueAmount: null,
        },
      });
    } else if (c.dueAmount && c.dueAmount > 0) {
      if (payload.amount >= c.dueAmount) {
        await strapi.documents('api::child.child').update({
          documentId: c.documentId,
          data: {
            isDue: false,
            dueAmount: null,
          },
        });
      } else {
        await strapi.documents('api::child.child').update({
          documentId: c.documentId,
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

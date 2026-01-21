/**
 * feedback controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::feedback.feedback', ({ strapi }) => ({
  async getFeedbackByChild(ctx) {
    try {
      const { childId, date } = ctx.params;
      if (!childId) {
        return ctx.badRequest('childId is required');
      }

      let feedbackDate;
      if (date && date !== 'today') {
        // check date format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
          return ctx.badRequest('Invalid date format. Use YYYY-MM-DD');
        }
        feedbackDate = date;
      } else {
        // Default to today's date
        feedbackDate = new Date().toISOString().split('T')[0];
      }

      const feedback = await strapi.entityService.findMany('api::feedback.feedback', {
        filters: {
          child: childId,
          createdDate: feedbackDate,
        },
        populate: {
          child: true,
          createdByUser: true,
        },
        limit: 1, // one feedback per child per day
      });

      return ctx.send(feedback);
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError('Something went wrong');
    }
  },

  async createFeedback(ctx) {
    try {
      const {
        mathScore,
        englishScore,
        mathTime,
        englishTime,
        isPercentFeedbackRequired,
        createdDate,
        child,
        feedback,
      } = ctx.request.body;

      const user = ctx.state.user; // logged-in user

      // validate child relation
      if (child) {
        const childExists = await strapi.entityService.findOne('api::child.child', child);

        if (!childExists) {
          return ctx.badRequest(`Child with id ${child} does not exist`);
        }
      }
      const createdFeedback = await strapi.entityService.create('api::feedback.feedback', {
        data: {
          mathScore: mathScore ?? null,
          englishScore: englishScore ?? null,
          mathTime: mathTime ?? null,
          englishTime: englishTime ?? null,
          isPercentFeedbackRequired: isPercentFeedbackRequired ?? false,
          createdDate,
          child,
          feedback: feedback ?? '',
          createdByUser: user?.id,
          updatedByUser: user?.id,
        },
      });
      return ctx.created(createdFeedback);
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError('Something went wrong');
    }
  },
  async updateTodayFeedbackByChild(ctx) {
    try {
      const { childId } = ctx.params;

      if (!childId) {
        return ctx.badRequest('childId is required');
      }

      const { mathScore, englishScore, mathTime, englishTime, isPercentFeedbackRequired, feedback } = ctx.request.body;

      // Get today's date (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];

      // Find today's feedback for this child
      const existingFeedback = await strapi.entityService.findMany('api::feedback.feedback', {
        filters: {
          child: childId,
          createdDate: today,
        },
        limit: 1,
      });

      if (!existingFeedback.length) {
        return ctx.notFound('Feedback not found for today');
      }

      const feedbackId = existingFeedback[0].id;

      const updatedFeedback = await strapi.entityService.update('api::feedback.feedback', feedbackId, {
        data: {
          mathScore: mathScore ?? null,
          englishScore: englishScore ?? null,
          mathTime: mathTime ?? null,
          englishTime: englishTime ?? null,
          isPercentFeedbackRequired: isPercentFeedbackRequired ?? false,
          feedback: feedback ?? '',
          updatedByUser: ctx.state.user?.id,
        },
      });

      return ctx.send(updatedFeedback);
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError('Something went wrong');
    }
  },
}));

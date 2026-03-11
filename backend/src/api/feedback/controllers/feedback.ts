/**
 * feedback controller
 */

import { factories } from '@strapi/strapi';
import OpenAI from 'openai';

interface Subject {
  name: string;
}

interface FeedbackInput {
  mathScore?: number | null;
  englishScore?: number | null;
  mathTime?: string | null;
  englishTime?: string | null;
  feedback?: string | null;
}

const checkFeedbackComplete = (feedbackData: FeedbackInput, subjects: Subject[]): boolean => {
  const hasFeedbackText = !!feedbackData.feedback?.trim();
  const hasMaths = subjects.some((subj) => subj.name === 'Maths');
  const hasEnglish = subjects.some((subj) => subj.name === 'English');
  const mathFilled = feedbackData.mathScore !== null && feedbackData.mathScore !== undefined && feedbackData.mathTime;
  const englishFilled =
    feedbackData.englishScore !== null && feedbackData.englishScore !== undefined && feedbackData.englishTime;

  if (!hasFeedbackText) {
    return false;
  }

  if (hasMaths && hasEnglish) {
    return !!(mathFilled && englishFilled);
  } else if (hasMaths && !hasEnglish) {
    return !!mathFilled;
  } else if (!hasMaths && hasEnglish) {
    return !!englishFilled;
  }

  return true;
};

const isEmptyValue = (value: unknown): boolean => {
  return value === null || value === undefined || value === 0 || value === '';
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default factories.createCoreController('api::feedback.feedback', ({ strapi }) => ({
  async formatFeedback(ctx) {
    try {
      const { feedback } = ctx.request.body as { feedback?: string };

      if (!feedback?.trim()) {
        return ctx.badRequest('feedback is required');
      }

      const response = await openai.responses.create({
        model: 'gpt-5-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'You are a helpful assistant that formats student feedback professionally. Take the raw feedback text and rewrite it with proper grammar, punctuation, and a professional tone suitable for parents to read. Keep the same meaning and details, but make it clear and well-structured. Return only the formatted feedback text with no additional commentary.',
              },
            ],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: feedback }],
          },
        ],
      });

      const formattedFeedback = response.output_text.trim() || feedback;

      return ctx.send({ data: formattedFeedback });
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError('Failed to format feedback');
    }
  },

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

      const feedback = await strapi.documents('api::feedback.feedback').findMany({
        filters: {
          child: {
            id: childId,
          },
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

  async create(ctx) {
    try {
      const {
        mathScore,
        englishScore,
        mathTime,
        englishTime,
        isPercentFeedbackRequired,
        createdDate,
        child: childFromBody,
        feedback,
      } = ctx.request.body;

      const user = ctx.state.user;
      const child = childFromBody || ctx.params.childId;

      if (!child) {
        return ctx.badRequest('child is required');
      }

      // Validate child and get subjects
      const childData = await strapi.documents('api::child.child').findFirst({
        filters: { id: child },
        populate: { subjects: true },
      });

      if (!childData) {
        return ctx.badRequest(`Child with id ${child} does not exist`);
      }

      const childSubjects: Subject[] = (childData.subjects as Subject[]) || [];
      const feedbackDate = createdDate || new Date().toISOString().split('T')[0];

      // Check if feedback already exists for this child on this date
      const existingFeedback = await strapi.documents('api::feedback.feedback').findMany({
        filters: {
          child: { id: child },
          createdDate: feedbackDate,
        },
        limit: 1,
      });

      if (existingFeedback.length) {
        // UPDATE — only overwrite fields that have a meaningful value
        const feedbackEntry = existingFeedback[0];

        const updateData: Record<string, unknown> = {
          isPercentFeedbackRequired: isPercentFeedbackRequired ?? feedbackEntry.isPercentFeedbackRequired ?? false,
          updatedByUser: user?.id,
        };

        if (!isEmptyValue(mathScore)) updateData.mathScore = mathScore;
        if (!isEmptyValue(englishScore)) updateData.englishScore = englishScore;
        if (!isEmptyValue(mathTime)) updateData.mathTime = mathTime;
        if (!isEmptyValue(englishTime)) updateData.englishTime = englishTime;
        if (!isEmptyValue(feedback)) updateData.feedback = feedback;

        await strapi.documents('api::feedback.feedback').update({
          documentId: feedbackEntry.documentId,
          data: updateData,
        });

        // Re-fetch updated feedback to check completion with merged values
        const updatedEntries = await strapi.documents('api::feedback.feedback').findMany({
          filters: {
            child: { id: child },
            createdDate: feedbackDate,
          },
          limit: 1,
        });

        const updated = updatedEntries[0];
        const mergedData: FeedbackInput = {
          mathScore: updated.mathScore as number | null,
          englishScore: updated.englishScore as number | null,
          mathTime: updated.mathTime as string | null,
          englishTime: updated.englishTime as string | null,
          feedback: updated.feedback as string | null,
        };

        const isFeedbackCompleted = checkFeedbackComplete(mergedData, childSubjects);

        const finalFeedback = await strapi.documents('api::feedback.feedback').update({
          documentId: updated.documentId,
          data: { isFeedbackCompleted },
        });

        return ctx.send(finalFeedback);
      }

      // CREATE
      const feedbackData: FeedbackInput = {
        mathScore: mathScore ?? null,
        englishScore: englishScore ?? null,
        mathTime: mathTime ?? null,
        englishTime: englishTime ?? null,
        feedback: feedback ?? null,
      };

      const isFeedbackCompleted = checkFeedbackComplete(feedbackData, childSubjects);

      const createdFeedback = await strapi.documents('api::feedback.feedback').create({
        data: {
          mathScore: feedbackData.mathScore,
          englishScore: feedbackData.englishScore,
          mathTime: feedbackData.mathTime,
          englishTime: feedbackData.englishTime,
          isPercentFeedbackRequired: isPercentFeedbackRequired ?? false,
          createdDate: feedbackDate,
          child,
          feedback: feedback ?? '',
          createdByUser: user?.id,
          updatedByUser: user?.id,
          isFeedbackCompleted,
        },
      });
      return ctx.created(createdFeedback);
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError('Something went wrong');
    }
  },
}));

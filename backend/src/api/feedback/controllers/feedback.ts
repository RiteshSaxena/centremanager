/**
 * feedback controller
 */

import { factories } from '@strapi/strapi';
import OpenAI from 'openai';
import moment from 'moment';
import { generateFeedbackEmailHtml, generateFeedbackEmailText } from '../../../utils/email';

const isEmptyValue = (value: unknown): boolean => {
  return value === null || value === undefined || value === 0 || value === '';
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default factories.createCoreController('api::feedback.feedback', ({ strapi }) => ({
  async formatFeedback(ctx) {
    try {
      const { studentName, subjects, feedback } = ctx.request.body as {
        studentName?: string;
        subjects?: string[];
        feedback?: string;
      };

      if (!feedback?.trim()) {
        return ctx.badRequest('feedback is required');
      }

      if (!studentName?.trim()) {
        return ctx.badRequest('studentName is required');
      }

      if (!subjects?.length) {
        return ctx.badRequest('subjects is required');
      }

      const response = await openai.responses.create({
        model: 'gpt-5-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: `You are an expert Education Administrator at a Kumon Center. Your task is to transform rough staff notes into a formal, professional progress log for a student's session record.

Core Requirements:
- Tone: Formal, objective, and supportive. Use the student's first name only.
- Structure: Every response must use the format [Subject]: [Feedback Text].
- Logic for Missing Subjects: Compare the "Subjects Enrolled" to the "Rough Notes." If a subject is enrolled but entirely missing from the notes, prepend the response with a bold warning: [WARNING: Missing feedback for [Subject]] and include the subject heading with a "[No feedback provided]" placeholder.
- Content Preservation:
  * Keep all specific Kumon levels (e.g., Level BII, 5a) exactly as written.
  * Do not include standard scores/times unless the notes specify a Milestone (e.g., "Passed Achievement Test") or exceptional volume (e.g., "Completed double work").
- Feedback Content per Subject:
  * What was achieved/worked on.
  * A specific strength, observation, or "win."
  * An area for focus or instruction for home study.

Return only the formatted feedback text with no additional commentary.`,
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Student Name: ${studentName}\nSubjects Enrolled: ${subjects.join(', ')}\nRough Notes: ${feedback}`,
              },
            ],
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

  async sendEmail(ctx) {
    try {
      const testEmail = process.env.TEST_MODE_FEEDBACK_EMAIL;
      if (!testEmail) {
        return ctx.badRequest('TEST_MODE_FEEDBACK_EMAIL environment variable is not set');
      }

      const { id } = ctx.params;
      if (!id) {
        return ctx.badRequest('feedback id is required');
      }

      const feedback = await strapi.documents('api::feedback.feedback').findFirst({
        filters: { id },
        populate: {
          child: {
            populate: {
              parents: true,
              center: true,
            },
          },
          updatedByUser: true,
        },
      });

      if (!feedback) {
        return ctx.notFound('Feedback not found');
      }

      const child = feedback.child;
      if (!child) {
        return ctx.badRequest('Feedback has no associated child');
      }

      const center = child.center;
      const centerName = center?.displayName || center?.name || 'Kumon Centre';
      const childName = `${child.firstName} ${child.lastName || ''}`.trim();
      const feedbackAuthor = feedback.updatedByUser
        ? `${feedback.updatedByUser.firstName || ''} ${feedback.updatedByUser.lastName || ''}`.trim()
        : undefined;

      const parents = child.parents || [];
      const firstParent = parents.find((p) => p.email);
      const parentName = firstParent ? `${firstParent.firstName} ${firstParent.lastName || ''}`.trim() : 'Parent';

      const feedbackDate = feedback.createdDate
        ? moment(feedback.createdDate).format('YYYY-MM-DD')
        : moment().format('YYYY-MM-DD');

      const feedbackData = {
        childName,
        parentName,
        schoolYear: child.schoolYear,
        mathScore: feedback.mathScore,
        englishScore: feedback.englishScore,
        mathTime: feedback.mathTime,
        englishTime: feedback.englishTime,
        feedback: feedback.feedback,
        feedbackAuthor,
        date: feedbackDate,
        centerName,
        centerEmail: center?.email,
        centerPhone: center?.phoneNumber,
        isFollowUpRequired: feedback.isPercentFeedbackRequired,
      };

      const subject = `[TEST] Performance Report for ${childName} - ${moment(feedbackDate).format('MMMM D, YYYY')}`;
      const html = generateFeedbackEmailHtml(feedbackData);
      const text = generateFeedbackEmailText(feedbackData);

      await strapi.plugins['email'].services.email.send({
        to: testEmail,
        subject,
        html,
        text,
      });

      return ctx.send({ message: `Test email sent to ${testEmail}` });
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError('Failed to send test email');
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

      // Validate child exists
      const childData = await strapi.documents('api::child.child').findFirst({
        filters: { id: child },
      });

      if (!childData) {
        return ctx.badRequest(`Child with id ${child} does not exist`);
      }

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
        };

        if (!isEmptyValue(mathScore)) updateData.mathScore = mathScore;
        if (!isEmptyValue(englishScore)) updateData.englishScore = englishScore;
        if (!isEmptyValue(mathTime)) updateData.mathTime = mathTime;
        if (!isEmptyValue(englishTime)) updateData.englishTime = englishTime;

        // Only update feedback text and user attribution if feedback text actually changed
        if (!isEmptyValue(feedback) && feedback !== feedbackEntry.feedback) {
          updateData.feedback = feedback;
          updateData.updatedByUser = user?.id;
        }

        const updatedFeedback = await strapi.documents('api::feedback.feedback').update({
          documentId: feedbackEntry.documentId,
          data: updateData,
        });

        return ctx.send(updatedFeedback);
      }

      // CREATE
      const createdFeedback = await strapi.documents('api::feedback.feedback').create({
        data: {
          mathScore: mathScore ?? null,
          englishScore: englishScore ?? null,
          mathTime: mathTime ?? null,
          englishTime: englishTime ?? null,
          isPercentFeedbackRequired: isPercentFeedbackRequired ?? false,
          createdDate: feedbackDate,
          child,
          feedback: feedback ?? '',
          createdByUser: user?.id,
          updatedByUser: feedback?.trim() ? user?.id : undefined,
        },
      });
      return ctx.created(createdFeedback);
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError('Something went wrong');
    }
  },
}));

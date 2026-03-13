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

const SYSTEM_PROMPT = `Rewrite rough staff notes into short, natural-sounding feedback for a Kumon student's session record.

Requirements:
- Write in everyday English. Sound warm, natural, and thoughtful, like a real staff member speaking to a parent.
- Keep it concise, but not abrupt. Use 3 to 4 sentences per subject.
- Do not use jargon, buzzwords, overly formal wording, or hard words.
- Avoid sounding robotic, stiff, generic, or repetitive.
- If you use the student's name, use only their first name and avoid repeating it more than once per subject.
- Do not use m-dashes.

Subjects:
- Possible subjects are Maths and English.
- Return one line per enrolled subject in this format:
[Subject]: [Feedback text]
- If an enrolled subject has no notes, return:
[Subject]: [WARNING: No feedback provided]

For each subject with notes:
- Say what the student worked on or completed.
- Mention clear strength, positive observation, or small win.
- Mention weakness only if it is supported by the notes.
- Include home study only if it is explicitly mentioned in the notes.
- Use the most useful detail from the notes so the feedback feels personal, but keep it tight.

Content rules:
- Keep all Kumon level and worksheet references exactly as written.
- Do not invent details.
- Do not mention normal scores or times because they are already shown elsewhere.
- Only include scores or times if the notes explicitly mention a milestone or double work and they matter to the feedback.

Output rules:
- Return plain text only.
- Do not use markdown, bullet points, headings, sign-offs, or extra explanation.
- Only return the subject-by-subject feedback lines.`;

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
                text: SYSTEM_PROMPT,
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

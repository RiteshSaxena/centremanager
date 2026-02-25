/**
 * feedback controller
 */

import { factories } from '@strapi/strapi';

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

      // validate child relation and get subjects
      let childSubjects: Subject[] = [];
      if (child) {
        const childData = await strapi.documents('api::child.child').findFirst({
          filters: {
            id: child,
          },
          populate: {
            subjects: true,
          },
        });

        if (!childData) {
          return ctx.badRequest(`Child with id ${child} does not exist`);
        }

        childSubjects = (childData.subjects as Subject[]) || [];
      }

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
          createdDate,
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
      const existingFeedback = await strapi.documents('api::feedback.feedback').findMany({
        filters: {
          child: {
            id: childId,
          },
          createdDate: today,
        },
        limit: 1,
      });

      if (!existingFeedback.length) {
        return ctx.notFound('Feedback not found for today');
      }

      const feedbackEntry = existingFeedback[0];

      // Get child's subjects
      const childData = await strapi.documents('api::child.child').findFirst({
        filters: {
          id: childId,
        },
        populate: {
          subjects: true,
        },
      });

      const childSubjects: Subject[] = (childData?.subjects as Subject[]) || [];

      const feedbackData: FeedbackInput = {
        mathScore: mathScore ?? null,
        englishScore: englishScore ?? null,
        mathTime: mathTime ?? null,
        englishTime: englishTime ?? null,
        feedback: feedback ?? null,
      };

      const isFeedbackCompleted = checkFeedbackComplete(feedbackData, childSubjects);

      const updatedFeedback = await strapi.documents('api::feedback.feedback').update({
        documentId: feedbackEntry.documentId,
        data: {
          mathScore: feedbackData.mathScore,
          englishScore: feedbackData.englishScore,
          mathTime: feedbackData.mathTime,
          englishTime: feedbackData.englishTime,
          isPercentFeedbackRequired: isPercentFeedbackRequired ?? false,
          feedback: feedback ?? '',
          updatedByUser: ctx.state.user?.id,
          isFeedbackCompleted,
        },
      });

      return ctx.send(updatedFeedback);
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError('Something went wrong');
    }
  },

  async sendFeedbackEmails(ctx) {
    try {
      const testModeEmail = 'hemant.kumar@techcurl.com';
      console.log('Manual feedback email trigger initiated', new Date().toISOString());
      console.log(`Test mode enabled - all emails will be sent to: ${testModeEmail}`);

      // Get feedbacks where isFeedbackCompleted is true and isMailSent is not true
      const feedbacks = await strapi.documents('api::feedback.feedback').findMany({
        filters: {
          isFeedbackCompleted: true,
          isMailSent: {
            $ne: true,
          },
        },
        populate: {
          child: {
            populate: {
              parents: true,
              center: true,
            },
          },
          createdByUser: true,
        },
      });

      if (!feedbacks.length) {
        console.log('No completed feedbacks pending email');
        return ctx.send({
          success: false,
          message: 'No pending feedback emails to send',
          sent: 0,
          failed: 0,
          total: 0,
        });
      }

      console.log(`Found ${feedbacks.length} feedbacks to send`);

      let successCount = 0;
      let failCount = 0;

      for (const feedback of feedbacks) {
        const child = feedback.child;
        if (!child) {
          console.log(`Feedback ${feedback.documentId} has no child, skipping`);
          continue;
        }

        const parents = child.parents || [];
        const center = child.center;

        // Check if center has feedback notifications enabled
        if (center && center.isFeedbackNotification === false) {
          console.log(
            `Center ${center.name} has feedback notifications disabled, skipping feedback for child ${child.firstName}`
          );
          continue;
        }

        const centerName = center?.displayName || center?.name || 'Kumon Centre';
        const childName = `${child.firstName} ${child.lastName || ''}`.trim();
        const feedbackAuthor = feedback.createdByUser
          ? `${feedback.createdByUser.firstName || ''} ${feedback.createdByUser.lastName || ''}`.trim()
          : undefined;

        // Get all parent emails
        const parentEmails = parents.filter((p) => p.email).map((p) => p.email);

        if (!parentEmails.length) {
          console.log(`No parents with email for child ${childName}, marking as sent`);
          await strapi.documents('api::feedback.feedback').update({
            documentId: feedback.documentId,
            data: { isMailSent: true },
          });
          continue;
        }

        // Use first parent's name for the email template
        const firstParent = parents.find((p) => p.email);
        const parentName = firstParent ? `${firstParent.firstName} ${firstParent.lastName || ''}`.trim() : 'Parent';

        const moment = require('moment');
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
          isFollowUpRequired: feedback.isPercentFeedbackRequired,
        };

        const { generateFeedbackEmailHtml, generateFeedbackEmailText } = require('../../utils/email');
        const subject = `Performance Report for ${childName} - ${moment(feedbackData.date).format('MMMM D, YYYY')}`;
        const html = generateFeedbackEmailHtml(feedbackData);
        const text = generateFeedbackEmailText(feedbackData);

        try {
          const fromEmail = process.env.FEEDBACK_EMAIL_FROM;
          const fromAddress = fromEmail ? `${centerName} <${fromEmail}>` : undefined;
          await strapi.plugins['email'].services.email.send({
            from: fromAddress,
            to: testModeEmail,
            subject: `[TEST - ${parentEmails.join(', ')}] ${subject}`,
            html,
            text,
          });
          console.log(
            `Email sent to ${testModeEmail} for ${childName} (original: ${parentEmails.join(', ')})`
          );
          successCount++;

          await strapi.documents('api::feedback.feedback').update({
            documentId: feedback.documentId,
            data: { isMailSent: true },
          });
        } catch (error) {
          console.error(`Failed to send email to ${testModeEmail}:`, error);
          failCount++;
        }
      }

      console.log(`Manual feedback email task completed: ${successCount} sent, ${failCount} failed`);

      return ctx.send({
        success: true,
        message: `Emails sent: ${successCount}, Failed: ${failCount}`,
        sent: successCount,
        failed: failCount,
        total: feedbacks.length,
      });
    } catch (error) {
      strapi.log.error('Error in sendFeedbackEmails:', error);
      return ctx.internalServerError('Failed to send feedback emails');
    }
  },

  async testEmail(ctx) {
    try {
      console.log('Testing email configuration...');

      await strapi.plugins['email'].services.email.send({
        to: 'hemant.kumar@techcurl.com',
        from: process.env.FEEDBACK_EMAIL_FROM || 'noreply@centre-manager.com',
        subject: 'Test Email from Centre Manager',
        text: 'This is a test email to verify SMTP configuration.',
        html: '<p>This is a test email to verify SMTP configuration.</p>',
      });

      console.log('Test email sent successfully');
      return ctx.send({
        success: true,
        message: 'Test email sent successfully to hemant.kumar@techcurl.com',
      });
    } catch (error) {
      console.error('Failed to send test email:', error);
      return ctx.internalServerError({
        success: false,
        message: 'Failed to send test email',
        error: error.message,
      });
    }
  },
}));

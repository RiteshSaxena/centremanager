/**
 * child controller
 */

import { factories } from '@strapi/strapi';
import utils from '@strapi/utils';
import { sanitizeChild } from '../../../utils/sanitize';
import schema from '../schema';

const { ValidationError } = utils.errors;

export default factories.createCoreController('api::child.child', ({ strapi }) => ({
  async find(ctx) {
    const entries = await strapi.documents('api::child.child').findMany({
      filters: {
        center: {
          id: ctx.state.center.id,
        },
      },
      populate: ['center', 'subjects', 'parents', 'school', 'slots'],
      sort: 'firstName:asc',
    });

    return entries.map((entry) => sanitizeChild(entry));
  },

  async findOne(ctx) {
    const entry = await strapi.documents('api::child.child').findFirst({
      filters: {
        id: ctx.params.id,
      },
      populate: ['parents', 'center', 'subjects', 'school', 'slots'],
    });

    if (!entry) {
      throw new ValidationError('Child not found');
    }

    if (entry.center.id !== ctx.state.center.id) {
      throw new ValidationError('Child not found');
    }

    const parents = await Promise.all(
      entry.parents.map(async (parent) => {
        const hasLogBook = await strapi.documents('api::log-book.log-book').findMany({
          filters: {
            type: {
              $in: ['Student', 'StudentWithParent'],
            },
            parent: {
              id: parent.id,
            },
            signInTime: {
              $notNull: true,
            },
          },
          sort: 'signInTime:desc',
          populate: ['signatureIn'],
          limit: 1,
        });

        if (hasLogBook.length) {
          return {
            ...parent,
            signatureId: hasLogBook[0].signatureIn.id,
          };
        }

        return parent;
      })
    );

    return sanitizeChild({
      ...entry,
      parents,
    });
  },

  async create(ctx) {
    const payload = await schema.createChild(ctx.request.body);
    const center = ctx.state.center;

    const newChild = await strapi.documents('api::child.child').create({
      data: {
        ...payload,
        center: center.id,
      },
    });

    return sanitizeChild(newChild);
  },

  async update(ctx) {
    const { id } = ctx.params;
    const payload = await schema.updateChild(ctx.request.body);
    const center = ctx.state.center;

    // Verify child exists and belongs to center
    const existingChild = await strapi.documents('api::child.child').findFirst({
      filters: { id },
      populate: ['center', 'statusLog'],
    });

    if (!existingChild) {
      throw new ValidationError('Child not found');
    }

    if (existingChild.center.id !== center.id) {
      throw new ValidationError('Child not found');
    }

    // Track status change if status is being updated
    let statusLog = (existingChild as any).statusLog || [];
    if (payload.status && payload.status !== existingChild.status) {
      statusLog = [
        ...statusLog,
        {
          from: existingChild.status,
          to: payload.status,
          date: new Date().toISOString(),
        },
      ];
    }

    const updatedChild = await strapi.documents('api::child.child').update({
      documentId: existingChild.documentId,
      data: {
        ...payload,
        statusLog,
      },
    });

    return sanitizeChild(updatedChild);
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const center = ctx.state.center;

    // Verify child exists and belongs to center
    const existingChild = await strapi.documents('api::child.child').findFirst({
      filters: { id },
      populate: ['center'],
    });

    if (!existingChild) {
      throw new ValidationError('Child not found');
    }

    if (existingChild.center.id !== center.id) {
      throw new ValidationError('Child not found');
    }

    await strapi.documents('api::child.child').delete({
      documentId: existingChild.documentId,
    });

    return { success: true };
  },

  async findWithPagination(ctx) {
    const centerId = ctx.state.center.id;
    const page = Math.max(1, parseInt(ctx.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(ctx.query.pageSize as string) || 50));
    const searchTerm = ((ctx.query.search as string) || '').trim();
    const status = ((ctx.query.status as string) || '').trim();

    const filters: any = {
      center: { id: centerId },
    };

    if (status) {
      filters.status = status;
    }

    if (searchTerm) {
      // Search parents by name to get matching parent IDs
      const matchingParents = await strapi.documents('api::parent.parent').findMany({
        filters: {
          $or: [{ firstName: { $containsi: searchTerm } }, { lastName: { $containsi: searchTerm } }],
        },
        limit: 1000,
      });
      const parentIds = matchingParents.map((p) => p.id);

      if (parentIds.length > 0) {
        filters.$or = [
          { firstName: { $containsi: searchTerm } },
          { lastName: { $containsi: searchTerm } },
          { parents: { id: { $in: parentIds } } },
        ];
      } else {
        filters.$or = [{ firstName: { $containsi: searchTerm } }, { lastName: { $containsi: searchTerm } }];
      }
    }

    const offset = (page - 1) * pageSize;

    const [entries, total] = await Promise.all([
      strapi.documents('api::child.child').findMany({
        filters,
        populate: ['center', 'subjects', 'parents', 'school', 'slots'],
        sort: ['enrollmentDate:desc', 'firstName:asc'],
        limit: pageSize,
        offset,
      }),
      strapi.documents('api::child.child').count({ filters }),
    ]);

    return {
      data: entries.map((entry) => sanitizeChild(entry)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async dueStudents(ctx) {
    const center = await strapi.documents('api::center.center').findFirst({
      filters: {
        id: ctx.state.center.id,
      },
      populate: {
        zohobooks: true,
      },
    });

    let dueStudents = [];
    let booksEnabled = false;

    if (center.paymentHandler === 'zohobooks') {
      let booksStudents = [];
      if (center.zohobooks) {
        booksEnabled = true;
        booksStudents = await strapi
          .service('api::zoho-books.zoho-books')
          .fetchContacts(center.id as number, center.zohobooks);
        booksEnabled = true;
      }

      dueStudents = booksStudents
        .filter((student: any) => student.parent.outstanding_receivable_amount > 0)
        .map((student: any) => {
          return {
            id: parseInt(student.designation),
            dueAmount: student.parent.outstanding_receivable_amount,
          };
        });
    } else if (center.paymentHandler === 'inbuilt') {
      booksEnabled = true;
      dueStudents = await strapi.documents('api::child.child').findMany({
        filters: {
          center: {
            id: ctx.state.center.id,
          },
          status: {
            $notIn: ['New', 'Exited'],
          },
          isDue: true,
        },
        sort: 'firstName:asc',
      });
      dueStudents = dueStudents.map((student) => ({
        ...sanitizeChild(student),
        id: student.id,
        dueAmount: student.dueAmount || center.defaultDueAmount || 1,
      }));
    }

    return {
      booksEnabled,
      dueStudents,
    };
  },
}));

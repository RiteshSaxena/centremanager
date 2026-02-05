/**
 * center-user controller
 */

import utils from '@strapi/utils';
import schema from '../schema';

const { ValidationError } = utils.errors;

interface User {
  id: number;
  documentId: string;
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  type: 'admin' | 'staff';
  center?: { id: number };
}

const sanitizeUser = (user: User) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  type: user.type,
});

export default {
  async find(ctx) {
    const user = ctx.state.user;
    const center = ctx.state.center;

    // Only admins can list users
    if (user.type !== 'admin') {
      throw new ValidationError('Only admins can manage users');
    }

    const users = await strapi.documents('plugin::users-permissions.user').findMany({
      filters: {
        center: {
          id: center.id,
        },
      },
      sort: 'firstName:asc',
    });

    return users.map((u) => sanitizeUser(u as User));
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const center = ctx.state.center;

    // Only admins can view users
    if (user.type !== 'admin') {
      throw new ValidationError('Only admins can manage users');
    }

    const targetUser = await strapi.documents('plugin::users-permissions.user').findFirst({
      filters: { id },
      populate: ['center'],
    });

    if (!targetUser) {
      throw new ValidationError('User not found');
    }

    if (targetUser.center?.id !== center.id) {
      throw new ValidationError('User not found');
    }

    return sanitizeUser(targetUser as User);
  },

  async create(ctx) {
    const payload = await schema.createUser(ctx.request.body);
    const user = ctx.state.user;
    const center = ctx.state.center;

    // Only admins can create users
    if (user.type !== 'admin') {
      throw new ValidationError('Only admins can manage users');
    }

    // Check if email already exists
    const existingUser = await strapi.documents('plugin::users-permissions.user').findFirst({
      filters: {
        email: payload.email.toLowerCase(),
      },
    });

    if (existingUser) {
      throw new ValidationError('Email already taken');
    }

    // Get authenticated role
    const roles = await strapi.documents('plugin::users-permissions.role').findMany({
      filters: {
        type: 'authenticated',
      },
      limit: 1,
    });

    if (!roles.length) {
      throw new ValidationError('Authenticated role not found');
    }

    const newUser = await strapi.documents('plugin::users-permissions.user').create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email.toLowerCase(),
        username: payload.email.toLowerCase(),
        password: payload.password,
        phoneNumber: payload.phoneNumber,
        type: payload.type,
        center: center.id,
        role: roles[0].id,
        provider: 'local',
        confirmed: true,
      },
    });

    return sanitizeUser(newUser as User);
  },

  async update(ctx) {
    const { id } = ctx.params;
    const payload = await schema.updateUser(ctx.request.body);
    const user = ctx.state.user;
    const center = ctx.state.center;

    // Only admins can update users
    if (user.type !== 'admin') {
      throw new ValidationError('Only admins can manage users');
    }

    // Verify user exists and belongs to center
    const targetUser = await strapi.documents('plugin::users-permissions.user').findFirst({
      filters: { id },
      populate: ['center'],
    });

    if (!targetUser) {
      throw new ValidationError('User not found');
    }

    if (targetUser.center?.id !== center.id) {
      throw new ValidationError('User not found');
    }

    // Check if email is being changed and already exists
    if (payload.email && payload.email.toLowerCase() !== targetUser.email) {
      const existingUser = await strapi.documents('plugin::users-permissions.user').findFirst({
        filters: {
          email: payload.email.toLowerCase(),
        },
      });

      if (existingUser) {
        throw new ValidationError('Email already taken');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
    if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
    if (payload.phoneNumber !== undefined) updateData.phoneNumber = payload.phoneNumber;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.email !== undefined) {
      updateData.email = payload.email.toLowerCase();
      updateData.username = payload.email.toLowerCase();
    }
    if (payload.password !== undefined) updateData.password = payload.password;

    const updatedUser = await strapi.documents('plugin::users-permissions.user').update({
      documentId: targetUser.documentId,
      data: updateData,
    });

    return sanitizeUser(updatedUser as User);
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const center = ctx.state.center;

    // Only admins can delete users
    if (user.type !== 'admin') {
      throw new ValidationError('Only admins can manage users');
    }

    // Verify user exists and belongs to center
    const targetUser = await strapi.documents('plugin::users-permissions.user').findFirst({
      filters: { id },
      populate: ['center'],
    });

    if (!targetUser) {
      throw new ValidationError('User not found');
    }

    if (targetUser.center?.id !== center.id) {
      throw new ValidationError('User not found');
    }

    // Prevent self-deletion
    if (targetUser.id === user.id) {
      throw new ValidationError('Cannot delete your own account');
    }

    await strapi.documents('plugin::users-permissions.user').delete({
      documentId: targetUser.documentId,
    });

    return { success: true };
  },
};

/**
 * center controller
 */

import { factories } from '@strapi/strapi';
import utils from '@strapi/utils';
import schema from '../schema';

const { ValidationError } = utils.errors;

export default factories.createCoreController('api::center.center', ({ strapi }) => ({
  async find(ctx) {
    return ctx.state.center;
  },
  async update(ctx) {
    const payload = await schema.centreUpdate(ctx.request.body);
    const center = ctx.state.center;

    const updatedCenter = await strapi.documents('api::center.center').update({
      documentId: center.documentId,
      data: {
        name: payload.name,
        displayName: payload.displayName,
        region: payload.region,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
      },
    });

    return updatedCenter;
  },
  async register(ctx) {
    const payload = await schema.centreRegister(ctx.request.body);

    payload.email = payload.email.toLowerCase();

    const inviteCode = await strapi.documents('api::invite-code.invite-code').findMany({
      filters: {
        code: payload.inviteCode,
      },
    });

    if (!inviteCode.length) {
      throw new ValidationError('Invalid invite code');
    }

    const currentInviteCode = inviteCode[0];

    if (!currentInviteCode.active) {
      throw new ValidationError('Invite code is not active');
    }

    if (currentInviteCode.isUsed) {
      throw new ValidationError('Invite code already used');
    }

    const appUserAlreadyExists = await strapi.documents('plugin::users-permissions.user').count({
      filters: {
        email: payload.email,
      },
    });

    if (appUserAlreadyExists > 0) {
      throw new ValidationError('Email already registered');
    }

    const roles = await strapi.documents('plugin::users-permissions.role').findMany({
      filters: {
        type: 'authenticated',
      },
      limit: 1,
    });

    if (!roles.length) {
      throw new ValidationError('Authenticated role not found');
    }

    const centerAlreadyExists = await strapi.documents('api::center.center').count({
      filters: {
        name: payload.centerName,
      },
    });

    if (centerAlreadyExists > 0) {
      throw new ValidationError('Centre with this name already exists');
    }

    const newCenter = await strapi.documents('api::center.center').create({
      data: {
        name: payload.centerName,
        subscription: {
          status: 'trial',
          trialExpiryDate: new Date().setDate(new Date().getDate() + 60),
        },
      },
    });

    await strapi.documents('plugin::users-permissions.user').create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        username: payload.email,
        password: payload.password,
        provider: 'local',
        center: newCenter.id,
        phoneNumber: payload.phoneNumber,
        role: roles[0].id,
        confirmed: true,
        type: 'admin',
      },
    });

    await strapi.documents('api::invite-code.invite-code').update({
      documentId: currentInviteCode.documentId,
      data: {
        isUsed: true,
        usedBy: newCenter.id,
      },
    });

    return newCenter;
  },
}));

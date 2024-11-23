/**
 * center controller
 */

import { factories } from '@strapi/strapi';
import utils from '@strapi/utils';
import schema from '../schema';
import newCenterPermissions from '../new-center-permissions';

const { ValidationError } = utils.errors;

export default factories.createCoreController('api::center.center', () => ({
  async find(ctx) {
    return ctx.state.center;
  },
  async register(ctx) {
    const payload = await schema.centreRegister(ctx.request.body);

    payload.email = payload.email.toLowerCase();

    const inviteCode = await strapi.entityService.findMany('api::invite-code.invite-code', {
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

    const adminUserAlreadyExists = await strapi.entityService.count('admin::user', {
      filters: {
        email: payload.email,
      },
    });

    const appUserAlreadyExists = await strapi.entityService.count('plugin::users-permissions.user', {
      filters: {
        email: payload.email,
      },
    });

    if (adminUserAlreadyExists > 0 || appUserAlreadyExists > 0) {
      throw new ValidationError('Email already taken');
    }

    const roles = (await strapi.entityService.findMany('plugin::users-permissions.role', {
      filters: {
        type: 'authenticated',
      },
      limit: 1,
    })) as any[];

    if (!roles.length) {
      throw new ValidationError('Authenticated role not found');
    }

    const centerAlreadyExists = await strapi.entityService.count('api::center.center', {
      filters: {
        name: payload.centerName,
      },
    });

    if (centerAlreadyExists > 0) {
      throw new ValidationError('Centre with this name already exists');
    }

    const newCenter = await strapi.entityService.create('api::center.center', {
      data: {
        name: payload.centerName,
        subscription: {
          status: 'trial',
          trialExpiryDate: new Date().setDate(new Date().getDate() + 60),
        },
      },
    });

    const newRole = await strapi.service('admin::role').create({
      name: `${payload.centerName} Role`,
      description: `${newCenter.id}`,
    });

    await strapi.service('admin::role').assignPermissions(newRole.id, newCenterPermissions.permissions);

    await strapi.service('admin::user').create({
      firstname: payload.firstName,
      lastname: payload.lastName,
      email: payload.email,
      username: payload.email,
      password: payload.password,
      registrationToken: null,
      isActive: true,
      roles: [newRole.id],
    });

    await strapi.entityService.create('plugin::users-permissions.user', {
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
      },
    });

    await strapi.entityService.update('api::invite-code.invite-code', currentInviteCode.id, {
      data: {
        isUsed: true,
        usedBy: newCenter.id,
      },
    });

    return newCenter;
  },
}));

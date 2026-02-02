import { Strapi } from '../../types';

export default async (strapi: Strapi) => {
  const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });

  const advancedSettings = {
    unique_email: true,
    allow_register: true,
    email_confirmation: true,
    email_reset_password: null,
    email_confirmation_redirection: null,
    default_role: 'authenticated',
  };

  await pluginStore.set({ key: 'advanced', value: advancedSettings });
};

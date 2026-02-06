import { Strapi } from '../../types';

import initSettings from './settings';
import syncPermissions from './permissions';

export default async ({ strapi }: { strapi: Strapi }) => {
  await initSettings(strapi);
  await syncPermissions(strapi);
};

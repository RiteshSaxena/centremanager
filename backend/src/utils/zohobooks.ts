import axios from 'axios';
import { Strapi } from '@strapi/strapi';

interface ZohoBooks {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  domain: string;
  organizationId: string;
}

export const fetchContacts = async (strapi: Strapi, centerId: number, zohoBooks: ZohoBooks, attempt = 1) => {
  try {
    const baseApiUrl = `https://www.zohoapis.${zohoBooks.domain}/books/v3`;

    const contactsRes = await axios.get(`${baseApiUrl}/contacts?organization_id=${zohoBooks.organizationId}`, {
      headers: {
        Authorization: `Bearer ${zohoBooks.accessToken}`
      }
    });

    const contactPersonsRes = await axios.get(`${baseApiUrl}/contacts/contactpersons?organization_id=${zohoBooks.organizationId}`, {
      headers: {
        Authorization: `Bearer ${zohoBooks.accessToken}`
      }
    });

    const students = contactPersonsRes.data.contact_persons.filter((contact: any) => contact.designation !== '');
    return students.map((student: any) => {
      const parent = contactsRes.data.contacts.find((contact: any) => contact.contact_id === student.contact_id);
      return {
        ...student,
        parent
      };
    });
  } catch (err) {
    if (err.response?.status === 401 && attempt < 3) {
      zohoBooks.accessToken = await fetchAccessToken(strapi, centerId, zohoBooks);
      return fetchContacts(strapi, centerId, zohoBooks, attempt + 1);
    }
    throw err;
  }
};

export const fetchAccessToken = async (strapi: Strapi, centerId: number, zohoBooks: ZohoBooks) => {
  const baseApiUrl = `https://accounts.zoho.${zohoBooks.domain}/oauth/v2`;

  const res = await axios.post(`${baseApiUrl}/token`, null, {
    params: {
      refresh_token: zohoBooks.refreshToken,
      client_id: zohoBooks.clientId,
      client_secret: zohoBooks.clientSecret,
      grant_type: 'refresh_token'
    }
  });

  const { access_token } = res.data;

  await strapi.entityService.update('api::center.center', centerId, {
    data: {
      zohobooks: {
        ...zohoBooks,
        accessToken: access_token
      }
    }
  });

  return access_token;
};

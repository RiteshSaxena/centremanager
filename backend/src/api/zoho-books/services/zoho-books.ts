import axios from 'axios';
import utils from '@strapi/utils';

const { ApplicationError } = utils.errors;

interface ZohoBooks {
  enabled: boolean;
  code: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  domain: string;
  organizationId: string;
}

export default () => ({
  async fetchContacts(centerId: number, zohoBooks: ZohoBooks, attempt = 1) {
    try {
      console.log('fetching contacts', zohoBooks);
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
        zohoBooks.accessToken = await strapi.service('api::zoho-books.zoho-books').fetchAccessToken(centerId, zohoBooks);
        return await strapi.service('api::zoho-books.zoho-books').fetchContacts(centerId, zohoBooks, attempt + 1);
      }
      throw new ApplicationError(`ZohoBooks: ${err.response?.data?.message || err.message}`);
    }
  },
  async generateToken(zohoBooks: ZohoBooks) {
    const baseApiUrl = `https://accounts.zoho.${zohoBooks.domain}/oauth/v2`;

    const res = await axios.post(`${baseApiUrl}/token`, null, {
      params: {
        code: zohoBooks.code,
        client_id: zohoBooks.clientId,
        client_secret: zohoBooks.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: 'https://www.zoho.com/books'
      }
    });

    console.log('fetching access token', res);

    const { access_token, error } = res.data;

    if (error || !access_token) {
      throw new ApplicationError(`ZohoBooks: Error generating access token - ${error}`);
    }

    return res.data;
  },
  async fetchAccessToken(centerId: number, zohoBooks: ZohoBooks) {
    const baseApiUrl = `https://accounts.zoho.${zohoBooks.domain}/oauth/v2`;

    const res = await axios.post(`${baseApiUrl}/token`, null, {
      params: {
        refresh_token: zohoBooks.refreshToken,
        client_id: zohoBooks.clientId,
        client_secret: zohoBooks.clientSecret,
        grant_type: 'refresh_token',
        redirect_uri: 'https://www.zoho.com/books'
      }
    });

    console.log('fetching access token', res);

    const { access_token, error } = res.data;

    if (error || !access_token) {
      throw new ApplicationError(`ZohoBooks: Error generating access token - ${error}`);
    }

    await strapi.entityService.update('api::center.center', centerId, {
      data: {
        zohobooks: {
          ...zohoBooks,
          accessToken: access_token
        }
      }
    });

    return access_token;
  }
});

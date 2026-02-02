import axios from 'axios';
import utils from '@strapi/utils';

const { ValidationError } = utils.errors;

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

interface ZohoBooksContactPersonResponse {
  contact_persons: {
    contact_person_id: string;
    contact_id: string;
    first_name: string;
    last_name: string;
    designation: string;
  }[];
}

interface ZohoBooksContactsResponse {
  contacts: {
    contact_id: string;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    mobile: string;
  }[];
}

export default () => ({
  async fetchContacts(centerId: number, zohoBooks: ZohoBooks, attempt = 1) {
    try {
      const baseApiUrl = `https://www.zohoapis.${zohoBooks.domain}/books/v3`;

      const contactsRes = await axios.get<ZohoBooksContactsResponse>(
        `${baseApiUrl}/contacts?organization_id=${zohoBooks.organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${zohoBooks.accessToken}`,
          },
        }
      );

      const contactPersonsRes = await axios.get<ZohoBooksContactPersonResponse>(
        `${baseApiUrl}/contacts/contactpersons?organization_id=${zohoBooks.organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${zohoBooks.accessToken}`,
          },
        }
      );

      const students = contactPersonsRes.data.contact_persons.filter((contact) => contact.designation !== '');
      return students.map((student) => {
        const parent = contactsRes.data.contacts.find((contact) => contact.contact_id === student.contact_id);
        return {
          ...student,
          parent,
        };
      });
    } catch (err) {
      if (err.response?.status === 401 && attempt < 3) {
        zohoBooks.accessToken = await strapi
          .service('api::zoho-books.zoho-books')
          .fetchAccessToken(centerId, zohoBooks);
        return await strapi.service('api::zoho-books.zoho-books').fetchContacts(centerId, zohoBooks, attempt + 1);
      }
      throw new ValidationError(`ZohoBooks: ${err.response?.data?.message || err.message}`);
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
        redirect_uri: 'https://www.zoho.com/books',
      },
    });

    const { access_token, error } = res.data;

    if (error || !access_token) {
      throw new ValidationError(`ZohoBooks: Error generating access token - ${error}`);
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
        redirect_uri: 'https://www.zoho.com/books',
      },
    });

    const { access_token, error } = res.data;

    if (error || !access_token) {
      throw new ValidationError(`ZohoBooks: Error generating access token - ${error}`);
    }

    const center = await strapi.documents('api::center.center').findFirst({
      filters: {
        id: centerId,
      },
    });

    if (center) {
      await strapi.documents('api::center.center').update({
        documentId: center.documentId,
        data: {
          zohobooks: {
            ...zohoBooks,
            accessToken: access_token,
          },
        },
      });
    }

    return access_token;
  },
});

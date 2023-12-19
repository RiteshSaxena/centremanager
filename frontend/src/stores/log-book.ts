import { defineStore } from 'pinia';
import axios from '@/axios';
import type { LogRecord } from '@/types';
import { userStore as useUserStore } from '@/stores/user';

interface GuestSignInPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  signature: string;
}

const convertBase64ToFile = async (base64: string) => {
  const fetchObject = await fetch(base64);
  const blob = await fetchObject.blob();
  return new File([blob], 'signature.png', { type: 'image/png' });
};

export const logBookStore = defineStore('log-book', {
  state: () => ({
    list: [] as LogRecord[],
    fetching: false
  }),
  actions: {
    async uploadImage(signature: string) {
      const userStore = useUserStore();
      let path = '';
      if (userStore.centre) {
        path = `centre-${userStore.centre.id}`;
      }
      const signatureFile = await convertBase64ToFile(signature);
      const formData = new FormData();
      formData.append('files', signatureFile);
      if (path) {
        formData.append('path', path);
      }
      return await axios.post('/upload', formData);
    },
    async importData(file: File) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/import-data', formData);
      return res.data;
    },
    async guestSignIn(payload: GuestSignInPayload) {
      const fileUploadRes = await this.uploadImage(payload.signature);
      const fileId = fileUploadRes.data[0].id;
      const res = await axios.post('/log-book/guest-sign-in', {
        ...payload,
        signature: fileId
      });
      return res.data;
    },
    async signIn(payload: any) {
      const fileUploadRes = await this.uploadImage(payload.signature);
      const fileId = fileUploadRes.data[0].id;
      const res = await axios.post('/log-book/sign-in', {
        ...payload,
        signature: fileId
      });
      return res.data;
    },
    async signOut(payload: any) {
      const fileUploadRes = await this.uploadImage(payload.signature);
      const fileId = fileUploadRes.data[0].id;
      const res = await axios.post('/log-book/sign-out', {
        ...payload,
        signature: fileId
      });
      return res.data;
    },
    async fetchList() {
      try {
        this.fetching = true;
        const res = await axios.get<LogRecord[]>('/log-book/list');
        this.list = res.data;
        return res.data;
      } finally {
        this.fetching = false;
      }
    }
  }
});

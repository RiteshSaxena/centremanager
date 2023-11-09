import { defineStore } from 'pinia';
import axios from '@/axios';

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
    loading: false
  }),
  actions: {
    async guestSignIn(payload: GuestSignInPayload) {
      try {
        this.loading = true;
        const signature = await convertBase64ToFile(payload.signature);
        const formData = new FormData();
        formData.append('files', signature);
        const fileUploadRes = await axios.post('/upload', formData);
        const fileId = fileUploadRes.data[0].id;
        const res = await axios.post('/log-book/guest-sign', {
          ...payload,
          type: 'SignIn',
          signature: fileId
        });
        return res.data;
      } finally {
        this.loading = false;
      }
    },
    async signIn(payload: any) {
      try {
        this.loading = true;
        const signature = await convertBase64ToFile(payload.signature);
        const formData = new FormData();
        formData.append('files', signature);
        const fileUploadRes = await axios.post('/upload', formData);
        const fileId = fileUploadRes.data[0].id;
        const res = await axios.post('/log-book/sign', {
          ...payload,
          type: 'SignIn',
          signature: fileId
        });
        return res.data;
      } finally {
        this.loading = false;
      }
    }
  }
});

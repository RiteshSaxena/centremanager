import { defineStore } from 'pinia';
import axios from '@/axios';
import { getToken, removeToken, saveToken } from '@/utils/token';

import type { User } from '@/types';

interface RegisterPayload {
  inviteCode: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  centerName: string;
}

export const userStore = defineStore('user', {
  state: () => ({
    token: getToken() as string | null,
    user: null as User | null,
    centre: null as any
  }),
  getters: {
    isLoggedIn(state) {
      return !!state.token;
    },
    isAdmin(state) {
      return state.user?.type === 'admin';
    }
  },
  actions: {
    async getCentre() {
      const res = await axios.get('/centers');
      this.centre = res.data;
      return res.data;
    },
    async login(email: string, password: string) {
      const res = await axios.post('/auth/local', {
        identifier: email,
        password
      });
      this.token = res.data.jwt;
      this.user = res.data.user;
      saveToken(res.data.jwt);
      return res.data;
    },
    async register(payload: RegisterPayload) {
      const res = await axios.post('/center/register', payload);
      return res.data;
    },
    async fetchMe() {
      if (!this.token) return;

      try {
        const res = await axios.get('/users/me');
        this.user = res.data;
      } catch (err) {
        this.logout();
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      removeToken();
    }
  }
});

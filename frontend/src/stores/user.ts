import { defineStore } from 'pinia';
import axios from '@/axios';
import { getToken, removeToken, saveToken } from '@/utils/token';

import type { User } from '@/types';

export const userStore = defineStore('user', {
  state: () => ({
    token: getToken() as string | null,
    user: null as User | null
  }),
  getters: {
    isLoggedIn(state) {
      return !!state.token;
    }
  },
  actions: {
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
    logout() {
      this.token = null;
      this.user = null;
      removeToken();
    }
  }
});

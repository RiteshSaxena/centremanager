import { defineStore } from 'pinia';
import axios from '@/axios';
import type { Center, UpdateCenterPayload } from '@/types';

export const useCenterStore = defineStore('center', {
  state: () => ({
    center: null as Center | null,
    loading: false
  }),
  actions: {
    async fetchCenter() {
      try {
        this.loading = true;
        const res = await axios.get<Center>('/centers');
        this.center = res.data;
        return res.data;
      } finally {
        this.loading = false;
      }
    },
    async updateCenter(payload: UpdateCenterPayload) {
      const res = await axios.put<Center>('/centers', payload);
      this.center = res.data;
      return res.data;
    }
  }
});

import { defineStore } from 'pinia';
import axios from '@/axios';

export const searchStore = defineStore('search', {
  state: () => ({
    results: [] as any[],
    loading: false
  }),
  actions: {
    async search(text: string) {
      try {
        this.loading = true;
        const res = await axios.post('/log-book/search', { text });
        this.results = [...res.data];
      } finally {
        this.loading = false;
      }
    }
  },
  getters: {
    getResults: (state) => state.results
  }
});

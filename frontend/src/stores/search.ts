import { defineStore } from 'pinia';
import axios from '@/axios';
import type { SearchResult } from '@/types';

interface AddParentPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  child: number;
}

export const searchStore = defineStore('search', {
  state: () => ({
    results: [] as SearchResult[],
    loading: false
  }),
  actions: {
    async search(text: string) {
      try {
        this.loading = true;
        const res = await axios.post<SearchResult[]>('/log-book/search', { text });
        this.results = [...res.data];
      } finally {
        this.loading = false;
      }
    },
    async searchByLastName(lastName: string) {
      try {
        this.loading = true;
        const res = await axios.post<SearchResult[]>('/log-book/search-by-last-name', {
          lastName
        });
        this.results = [...res.data];
      } finally {
        this.loading = false;
      }
    },
    clearResults() {
      this.results = [];
    },
    async addParent(payload: AddParentPayload) {
      const res = await axios.post('/parents', payload);
      return res.data;
    }
  },
  getters: {
    getResults: (state) => state.results
  }
});

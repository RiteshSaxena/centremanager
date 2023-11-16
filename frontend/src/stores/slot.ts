import { defineStore } from 'pinia';
import axios from '@/axios';
import type { Slot } from '@/types';

export const slotStore = defineStore('slot', {
  state: () => ({
    slots: [] as Slot[],
    loading: false
  }),
  actions: {
    async fetchSlots() {
      try {
        this.loading = true;
        const res = await axios.get<Slot[]>('/slots');
        this.slots = [...res.data];
      } finally {
        this.loading = false;
      }
    }
  }
});

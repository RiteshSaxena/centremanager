import { defineStore } from 'pinia';
import axios from '@/axios';
import type { Slot, CreateSlotPayload, UpdateSlotPayload } from '@/types';

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
    },
    async createSlot(payload: CreateSlotPayload) {
      const res = await axios.post<Slot>('/slots', payload);
      this.slots.push(res.data);
      return res.data;
    },
    async updateSlot(id: number, payload: UpdateSlotPayload) {
      const res = await axios.put<Slot>(`/slots/${id}`, payload);
      const index = this.slots.findIndex((s) => s.id === id);
      if (index !== -1) {
        this.slots[index] = res.data;
      }
      return res.data;
    },
    async deleteSlot(id: number) {
      await axios.delete(`/slots/${id}`);
      this.slots = this.slots.filter((s) => s.id !== id);
    },
    async fetchSlot(id: number) {
      const res = await axios.get<Slot>(`/slots/${id}`);
      // Update local state
      const index = this.slots.findIndex((s) => s.id === id);
      if (index !== -1) {
        this.slots[index] = res.data;
      }
      return res.data;
    }
  }
});

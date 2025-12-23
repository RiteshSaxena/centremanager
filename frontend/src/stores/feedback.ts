// src/stores/feedback.ts
import { defineStore } from 'pinia';
import axios from '@/axios';

export interface Feedback {
  id: number;
  mathScore: number | null;
  englishScore: number | null;
  mathTime: string | null;
  englishTime: string | null;
  isPercentFeedbackRequired: boolean;
  createdDate: string;
  createdAt: string;
  updatedAt: string;
  feedback:string;
}

export interface FeedbackPayload {
  mathScore: number | null;
  englishScore: number | null;
  mathTime: number | null;
  englishTime: number | null;
  isPercentFeedbackRequired: boolean;
  createdDate: string;
  child: number;
  feedback:string;
}

export const useFeedbackStore = defineStore('feedback', {
  state: () => ({
    loading: false,
        todayFeedback: null as Feedback | null

  }),

  actions: {
     resetTodayFeedback() {
      this.todayFeedback = null;
    },
    async createFeedback(payload: FeedbackPayload) {
      try {
        this.loading = true;
        const res = await axios.post('/feedback/custom-create', payload);
        return res.data;
      } finally {
        this.loading = false;
      }
    },
    // ✅ NEW: fetch today's feedback by childId
     async fetchTodayFeedbackByChild(childId: number) {
      try {
        this.loading = true;
        const res = await axios.get(
          `/feedback/by-child/${childId}/today`
        );
        this.todayFeedback = res.data?.[0] || null;
        return this.todayFeedback;
      } finally {
        this.loading = false;
      }
    },
    async updateFeedback(childId: number, payload: Partial<FeedbackPayload>) {
     try {
        this.loading = true;
        const res = await axios.put(
          `/feedback/by-child/${childId}/today`,
          payload
        );

        this.todayFeedback = res.data;
        return res.data;
      } finally {
        this.loading = false;
      }
    }
  }
});

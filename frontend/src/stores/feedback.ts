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
  feedback: string;
  child?: number;
  createdByUser?: {
    firstName: string;
    lastName: string;
  };
}

export interface FeedbackPayload {
  mathScore: number | null;
  englishScore: number | null;
  mathTime: number | null;
  englishTime: number | null;
  isPercentFeedbackRequired: boolean;
  createdDate: string;
  child: number;
  feedback: string;
}

export const useFeedbackStore = defineStore('feedback', {
  state: () => ({
    loading: false
  }),

  actions: {
    async createOrUpdateFeedback(payload: FeedbackPayload) {
      try {
        this.loading = true;
        const res = await axios.post('/feedbacks', payload);
        return res.data;
      } finally {
        this.loading = false;
      }
    },
    async formatFeedback(payload: { feedback: string; studentName: string; subjects: string[] }): Promise<string> {
      const res = await axios.post<{ data: string }>('/feedback/format-feedback', payload);
      return res.data.data;
    },
    async fetchTodayFeedbackByChild(childId: number) {
      try {
        this.loading = true;
        const res = await axios.get(`/feedback/by-child/${childId}/today`);
        return res.data?.[0] || null;
      } finally {
        this.loading = false;
      }
    }
  }
});

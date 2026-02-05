import { defineStore } from 'pinia';
import axios from '@/axios';
import type { User } from '@/types';

export interface CreateUserPayload {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  type: 'admin' | 'staff';
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  type?: 'admin' | 'staff';
}

export const useAdminUserStore = defineStore('adminUser', {
  state: () => ({
    users: [] as User[],
    loading: false
  }),
  actions: {
    async fetchUsers() {
      try {
        this.loading = true;
        const res = await axios.get<User[]>('/center-users');
        this.users = res.data;
        return res.data;
      } finally {
        this.loading = false;
      }
    },
    async createUser(payload: CreateUserPayload) {
      const res = await axios.post<User>('/center-users', payload);
      this.users.push(res.data);
      return res.data;
    },
    async updateUser(id: number, payload: UpdateUserPayload) {
      const res = await axios.put<User>(`/center-users/${id}`, payload);
      const index = this.users.findIndex((u) => u.id === id);
      if (index !== -1) {
        this.users[index] = res.data;
      }
      return res.data;
    },
    async deleteUser(id: number) {
      await axios.delete(`/center-users/${id}`);
      this.users = this.users.filter((u) => u.id !== id);
    }
  }
});

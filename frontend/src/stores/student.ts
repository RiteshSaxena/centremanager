import { defineStore } from 'pinia';
import QRCode from 'qrcode';
import axios from '@/axios';
import type { Student } from '@/types';

interface Books {
  enabled: boolean;
  dueStudents: {
    id: number;
    dueAmount: number;
  }[];
}

const generateQR = async (text: string) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error(err);
  }
};

export const studentStore = defineStore('student', {
  state: () => ({
    students: [] as Student[],
    books: {
      enabled: false,
      dueStudents: []
    } as Books,
    loading: false
  }),
  actions: {
    async fetchStudents() {
      try {
        this.loading = true;
        const res = await axios.get<Student[]>('/children');
        const students = await Promise.all(
          res.data.map(async (student) => {
            const qrCode = await generateQR(`student-${student.id}`);
            return {
              ...student,
              qrCode
            };
          })
        );
        this.students = students as any;
      } finally {
        this.loading = false;
      }
    },
    async fetchStudent(id: number) {
      const res = await axios.get<Student>(`/children/${id}`);
      return res.data;
    },
    async fetchPayments(childId?: number) {
      let query = '';
      if (childId) {
        query = `?child=${childId}`;
      }
      const res = await axios.get(`/payments${query}`);
      return res.data;
    },
    async addPayment(payload: any) {
      const res = await axios.post(`/payments`, payload);
      return res.data;
    },
    async dueStudents() {
      const res = await axios.get('/children/due-students');
      this.books.enabled = res.data.booksEnabled;
      this.books.dueStudents = res.data.dueStudents;
      return res.data;
    }
  }
});

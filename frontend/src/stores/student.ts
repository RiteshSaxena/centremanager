import { defineStore } from 'pinia';
import QRCode from 'qrcode';
import axios from '@/axios';
import type { Student } from '@/types';

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
    }
  }
});

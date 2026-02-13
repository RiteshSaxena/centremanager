import { defineStore } from 'pinia';
import QRCode from 'qrcode';
import axios from '@/axios';
import type {
  Student,
  CreateChildPayload,
  UpdateChildPayload,
  Subject,
  Parent,
  School
} from '@/types';
import type { Slot } from '@/types/slot';

interface Books {
  enabled: boolean;
  dueStudents: {
    id: number;
    dueAmount: number;
  }[];
}

interface AddParentPayload {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  child: number;
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
        this.students = res.data;
      } finally {
        this.loading = false;
      }
    },
    async fetchStudentsAndQr() {
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
        this.students = students as any[];
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
    async updatePayment(id: number, payload: { amount?: number; paymentDate?: string; notes?: string | null }) {
      const res = await axios.put(`/payments/${id}`, payload);
      return res.data;
    },
    async dueStudents() {
      const res = await axios.get('/children/due-students');
      this.books.enabled = res.data.booksEnabled;
      this.books.dueStudents = res.data.dueStudents;
      return res.data;
    },
    async createChild(payload: CreateChildPayload) {
      const res = await axios.post<Student>('/children', payload);
      const qrCode = await generateQR(`student-${res.data.id}`);
      const student = { ...res.data, qrCode } as Student;
      this.students.push(student);
      return student;
    },
    async updateChild(id: number, payload: UpdateChildPayload) {
      const res = await axios.put<Student>(`/children/${id}`, payload);
      const index = this.students.findIndex((s) => s.id === id);
      if (index !== -1) {
        const qrCode = this.students[index].qrCode;
        this.students[index] = { ...res.data, qrCode };
      }
      return res.data;
    },
    async deleteChild(id: number) {
      await axios.delete(`/children/${id}`);
      this.students = this.students.filter((s) => s.id !== id);
    },
    async addParent(payload: AddParentPayload) {
      const res = await axios.post<Parent>('/parents', payload);
      // Update the child in local state
      const childIndex = this.students.findIndex((s) => s.id === payload.child);
      if (childIndex !== -1) {
        if (!this.students[childIndex].parents) {
          this.students[childIndex].parents = [];
        }
        this.students[childIndex].parents.push(res.data);
      }
      return res.data;
    },
    async removeParent(childId: number, parentId: number) {
      // Update child to remove parent from the relation
      const child = this.students.find((s) => s.id === childId);
      if (child && child.parents) {
        const parentIds = child.parents.filter((p) => p.id !== parentId).map((p) => p.id);
        await this.updateChild(childId, { parents: parentIds } as any);
        // Update local state
        child.parents = child.parents.filter((p) => p.id !== parentId);
      }
    },
    async fetchSubjects() {
      const res = await axios.get<{ data: Subject[] }>('/subjects');
      return res.data.data;
    },
    async fetchSlots() {
      const res = await axios.get<Slot[]>('/slots');
      return res.data;
    },
    async fetchSchools() {
      const res = await axios.get<{ data: School[] }>('/schools');
      return res.data.data;
    }
  }
});

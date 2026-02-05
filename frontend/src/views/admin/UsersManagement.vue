<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Input, Button, Table, Badge } from '@/components/ui';
import type { TableColumn } from '@/components/ui/Table.vue';
import type { User } from '@/types';

import UserModal from '@/components/admin/UserModal.vue';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal.vue';
import { useAdminUserStore, useUserStore } from '@/stores';

const adminUserStore = useAdminUserStore();
const userStore = useUserStore();

const search = ref('');
const showUserModal = ref(false);
const showDeleteModal = ref(false);
const selectedUser = ref<User | null>(null);
const saving = ref(false);
const deleting = ref(false);

const columns: TableColumn[] = [
  { key: 'index', header: '#', width: '60px' },
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email', hideOnMobile: true },
  { key: 'type', header: 'Type' },
  { key: 'actions', header: 'Actions', hideOnMobile: true }
];

const filteredUsers = computed(() => {
  let users = adminUserStore.users;
  if (search.value.trim()) {
    const term = search.value.toLowerCase();
    users = users.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
    );
  }
  return users;
});

const tableData = computed(() => {
  return filteredUsers.value.map((user, index) => ({
    ...user,
    index: index + 1,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'
  }));
});

const openCreateModal = () => {
  selectedUser.value = null;
  showUserModal.value = true;
};

const openEditModal = (user: User) => {
  selectedUser.value = user;
  showUserModal.value = true;
};

const openDeleteModal = (user: User) => {
  selectedUser.value = user;
  showDeleteModal.value = true;
};

const handleSubmit = async (payload: any) => {
  try {
    saving.value = true;
    if (selectedUser.value) {
      await adminUserStore.updateUser(selectedUser.value.id, payload);
    } else {
      await adminUserStore.createUser(payload);
    }
    showUserModal.value = false;
    selectedUser.value = null;
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to save user');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async () => {
  if (!selectedUser.value) return;

  // Prevent deleting yourself
  if (selectedUser.value.id === userStore.user?.id) {
    alert('You cannot delete your own account');
    showDeleteModal.value = false;
    return;
  }

  try {
    deleting.value = true;
    await adminUserStore.deleteUser(selectedUser.value.id);
    showDeleteModal.value = false;
    selectedUser.value = null;
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to delete user');
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  adminUserStore.fetchUsers();
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-xs">
          <i class="fa-solid fa-users text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-secondary-900">Users Management</h2>
          <p class="text-sm text-secondary-500">Manage admin and staff users</p>
        </div>
      </div>
    </div>

    <!-- Content Card -->
    <div class="bg-white rounded-xl border border-secondary-200 shadow-xs overflow-hidden">
      <div
        class="bg-linear-to-r from-primary-50 to-primary-100 px-5 py-4 border-b border-primary-200"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
              <i class="fa-solid fa-user-gear text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-primary-900">All Users</h3>
              <p class="text-xs text-primary-600">{{ filteredUsers.length }} total</p>
            </div>
          </div>
          <Button @click="openCreateModal">
            <i class="fa-solid fa-plus mr-1"></i>
            Add User
          </Button>
        </div>
      </div>

      <div class="p-5">
        <!-- Search -->
        <div class="bg-secondary-50 rounded-xl border border-secondary-200 p-4 mb-4">
          <div class="flex items-center gap-2 mb-3">
            <i class="fa-solid fa-magnifying-glass text-primary-600"></i>
            <label class="text-sm font-semibold text-secondary-700">Search Users</label>
          </div>
          <Input v-model="search" type="search" placeholder="Search by name or email..." />
        </div>

        <!-- Table -->
        <Table
          :columns="columns"
          :data="tableData"
          :loading="adminUserStore.loading"
          header-class="bg-white border-b border-secondary-200"
          empty-text="No users found"
        >
          <template #cell-index="{ value }">
            <span class="text-secondary-400 text-xs font-medium">{{ value }}</span>
          </template>
          <template #cell-name="{ row }">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0"
              >
                <i class="fa-solid fa-user text-primary-600 text-xs"></i>
              </div>
              <span class="font-semibold text-secondary-900">{{ row.name }}</span>
            </div>
          </template>
          <template #cell-email="{ row }">
            <span class="text-secondary-600">{{ row.email }}</span>
          </template>
          <template #cell-type="{ row }">
            <Badge :variant="row.type === 'admin' ? 'info' : 'neutral'">
              {{ row.type }}
            </Badge>
          </template>
          <template #cell-actions="{ row }">
            <div class="flex items-center gap-2">
              <Button size="sm" variant="ghost" @click="openEditModal(row)">
                <i class="fa-solid fa-pen"></i>
              </Button>
              <Button size="sm" variant="ghost" @click="openDeleteModal(row)">
                <i class="fa-solid fa-trash text-danger-500"></i>
              </Button>
            </div>
          </template>

          <!-- Mobile card view -->
          <template #mobile-card="{ row }">
            <div class="flex items-center justify-between py-3 border-b border-secondary-100">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <i class="fa-solid fa-user text-primary-600"></i>
                </div>
                <div>
                  <p class="font-semibold text-secondary-900">{{ row.name }}</p>
                  <p class="text-xs text-secondary-500">{{ row.email }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge :variant="row.type === 'admin' ? 'info' : 'neutral'" class="mr-2">
                  {{ row.type }}
                </Badge>
                <Button size="sm" variant="ghost" @click="openEditModal(row)">
                  <i class="fa-solid fa-pen"></i>
                </Button>
                <Button size="sm" variant="ghost" @click="openDeleteModal(row)">
                  <i class="fa-solid fa-trash text-danger-500"></i>
                </Button>
              </div>
            </div>
          </template>
        </Table>
      </div>
    </div>

    <!-- User Modal -->
    <UserModal
      v-model:show="showUserModal"
      :user="selectedUser"
      :loading="saving"
      @submit="handleSubmit"
    />

    <!-- Delete Confirm Modal -->
    <DeleteConfirmModal
      v-model:show="showDeleteModal"
      :loading="deleting"
      title="Delete User"
      message="Are you sure you want to delete this user? This action cannot be undone."
      :item-name="selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ''"
      @confirm="handleDelete"
    />
  </div>
</template>

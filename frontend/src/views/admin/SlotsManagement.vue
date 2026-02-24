<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Input, Button, Table, Badge } from '@/components/ui';
import type { TableColumn } from '@/components/ui/Table.vue';
import type { Slot } from '@/types';

import SlotModal from '@/components/admin/SlotModal.vue';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal.vue';
import { useSlotStore } from '@/stores';

const slotStore = useSlotStore();

const search = ref('');
const showSlotModal = ref(false);
const showDeleteModal = ref(false);
const selectedSlot = ref<Slot | null>(null);
const saving = ref(false);
const deleting = ref(false);

const columns: TableColumn[] = [
  { key: 'index', header: '#', width: '60px' },
  { key: 'name', header: 'Name' },
  { key: 'day', header: 'Day' },
  { key: 'time', header: 'Time', hideOnMobile: true },
  { key: 'children', header: 'Students', hideOnMobile: true },
  { key: 'actions', header: 'Actions', hideOnMobile: true }
];

const dayOrder: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

const filteredSlots = computed(() => {
  let slots = [...slotStore.slots];

  // Sort by day order, then by name
  slots.sort((a, b) => {
    const dayA = dayOrder[a.day] || 8;
    const dayB = dayOrder[b.day] || 8;
    if (dayA !== dayB) return dayA - dayB;
    return (a.name || '').localeCompare(b.name || '');
  });

  if (search.value.trim()) {
    const term = search.value.toLowerCase();
    slots = slots.filter(
      (s) => s.name?.toLowerCase().includes(term) || s.day?.toLowerCase().includes(term)
    );
  }
  return slots;
});

const formatTime = (time: string) => {
  if (!time) return '-';
  const [hours, minutes] = time.split(':') as [string, string];
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const tableData = computed(() => {
  return filteredSlots.value.map((slot, index) => ({
    ...slot,
    index: index + 1,
    time: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
    childrenCount: slot.children?.length || 0
  }));
});

const openCreateModal = () => {
  selectedSlot.value = null;
  showSlotModal.value = true;
};

const openEditModal = (slot: Slot) => {
  selectedSlot.value = slot;
  showSlotModal.value = true;
};

const openDeleteModal = (slot: Slot) => {
  selectedSlot.value = slot;
  showDeleteModal.value = true;
};

const handleSubmit = async (payload: any) => {
  try {
    saving.value = true;
    if (selectedSlot.value) {
      await slotStore.updateSlot(selectedSlot.value.id, payload);
    } else {
      await slotStore.createSlot(payload);
    }
    showSlotModal.value = false;
    selectedSlot.value = null;
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to save slot');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async () => {
  if (!selectedSlot.value) return;

  try {
    deleting.value = true;
    await slotStore.deleteSlot(selectedSlot.value.id);
    showDeleteModal.value = false;
    selectedSlot.value = null;
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to delete slot');
  } finally {
    deleting.value = false;
  }
};

const handleRefresh = async () => {
  // Refresh slot data after student changes
  if (selectedSlot.value) {
    const updatedSlot = await slotStore.fetchSlot(selectedSlot.value.id);
    selectedSlot.value = updatedSlot;
  }
};

onMounted(() => {
  slotStore.fetchSlots();
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-xs">
          <i class="fa-solid fa-clock text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-secondary-900">Slots Management</h2>
          <p class="text-sm text-secondary-500">Manage class time slots</p>
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
              <i class="fa-solid fa-calendar-days text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-primary-900">All Slots</h3>
              <p class="text-xs text-primary-600">{{ filteredSlots.length }} total</p>
            </div>
          </div>
          <Button @click="openCreateModal">
            <i class="fa-solid fa-plus mr-1"></i>
            Add Slot
          </Button>
        </div>
      </div>

      <div class="p-5">
        <!-- Search -->
        <div class="bg-secondary-50 rounded-xl border border-secondary-200 p-4 mb-4">
          <div class="flex items-center gap-2 mb-3">
            <i class="fa-solid fa-magnifying-glass text-primary-600"></i>
            <label class="text-sm font-semibold text-secondary-700">Search Slots</label>
          </div>
          <Input v-model="search" type="search" placeholder="Search by name or day..." />
        </div>

        <!-- Table -->
        <Table
          :columns="columns"
          :data="tableData"
          :loading="slotStore.loading"
          header-class="bg-white border-b border-secondary-200"
          empty-text="No slots found"
        >
          <template #cell-index="{ value }">
            <span class="text-secondary-400 text-xs font-medium">{{ value }}</span>
          </template>
          <template #cell-name="{ row }">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0"
              >
                <i class="fa-solid fa-clock text-primary-600 text-xs"></i>
              </div>
              <span class="font-semibold text-secondary-900">{{ row.name }}</span>
            </div>
          </template>
          <template #cell-day="{ row }">
            <Badge variant="neutral">{{ row.day }}</Badge>
          </template>
          <template #cell-time="{ row }">
            <span class="text-secondary-600">{{ row.time }}</span>
          </template>
          <template #cell-children="{ row }">
            <span class="text-secondary-600">{{ row.childrenCount }} students</span>
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
                  <i class="fa-solid fa-clock text-primary-600"></i>
                </div>
                <div>
                  <p class="font-semibold text-secondary-900">{{ row.name }}</p>
                  <p class="text-xs text-secondary-500">{{ row.day }} {{ row.time }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
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

    <!-- Slot Modal -->
    <SlotModal
      v-model:show="showSlotModal"
      :slot-data="selectedSlot"
      :loading="saving"
      @submit="handleSubmit"
      @refresh="handleRefresh"
    />

    <!-- Delete Confirm Modal -->
    <DeleteConfirmModal
      v-model:show="showDeleteModal"
      :loading="deleting"
      title="Delete Slot"
      message="Are you sure you want to delete this slot? Students assigned to this slot will be unassigned."
      :item-name="selectedSlot?.name || ''"
      @confirm="handleDelete"
    />
  </div>
</template>

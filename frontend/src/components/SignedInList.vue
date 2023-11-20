<script setup lang="ts">
import { computed, ref } from 'vue';
import { useToast } from 'vue-toastification';

import Card from '@/components/base/Card.vue';
import SignedInListItem from '@/components/SignedInListItem.vue';
import SignOutModal from '@/components/SignOutModal.vue';

import { useLogBookStore } from '@/stores';

import type { LogRecord } from '@/types';

const props = defineProps<{
  filter?: string;
}>();

const toast = useToast();
const logBookStore = useLogBookStore();

const signing = ref(false);
const showModal = ref(false);
const selectedRecord = ref<LogRecord | null>(null);

const loading = computed(() => logBookStore.fetching);

const signedIn = computed(() => {
  const list = logBookStore.list.filter((item) => !item.signOutTime);
  const sortOrder = ['Student', 'StudentWithParent', 'Parent', 'Guest', 'Staff'];
  list.sort((a, b) => {
    const aIndex = sortOrder.indexOf(a.type);
    const bIndex = sortOrder.indexOf(b.type);
    if (aIndex < bIndex) {
      return -1;
    }
    if (aIndex > bIndex) {
      return 1;
    }

    return 0;
  });
  const text = props.filter?.trim().toLowerCase() || '';
  if (text) {
    return list.filter((item) => {
      if (item.type === 'Student' || item.type === 'StudentWithParent') {
        return (
          item.student?.firstName?.toLowerCase().includes(text) ||
          item.student?.lastName?.toLowerCase().includes(text) ||
          item.parent?.firstName?.toLowerCase().includes(text) ||
          item.parent?.lastName?.toLowerCase().includes(text) ||
          item.parent?.email?.toLowerCase().includes(text) ||
          item.parent?.contactNumber?.toLowerCase().includes(text)
        );
      } else if (item.type === 'Staff') {
        return (
          item.staff?.firstName?.toLowerCase().includes(text) ||
          item.staff?.lastName?.toLowerCase().includes(text) ||
          item.staff?.email?.toLowerCase().includes(text) ||
          item.staff?.phoneNumber?.toLowerCase().includes(text)
        );
      } else if (item.type === 'Parent') {
        return (
          item.parent?.firstName?.toLowerCase().includes(text) ||
          item.parent?.lastName?.toLowerCase().includes(text) ||
          item.parent?.email?.toLowerCase().includes(text) ||
          item.parent?.contactNumber?.toLowerCase().includes(text)
        );
      } else if (item.type === 'Guest') {
        return (
          item.guest?.firstName?.toLowerCase().includes(text) ||
          item.guest?.lastName?.toLowerCase().includes(text) ||
          item.guest?.email?.toLowerCase().includes(text) ||
          item.guest?.phoneNumber?.toLowerCase().includes(text)
        );
      }
      return false;
    });
  }
  return list;
});

const onSelect = (item: LogRecord) => {
  selectedRecord.value = item;
  showModal.value = true;
};

const onSubmit = async (data: any) => {
  try {
    signing.value = true;
    const payload: any = {
      signature: data.signature,
      signIn: selectedRecord.value?.id
    };

    await logBookStore.signOut(payload);

    showModal.value = false;
    toast.success('Signed out Successfully');
    logBookStore.fetchList().then();
  } finally {
    signing.value = false;
  }
};
</script>

<template>
  <Card class="signed-in-list">
    <template #header> People Signed In </template>
    <div class="text-center mb-3" v-if="loading">
      <div class="spinner-border text-dark text-center" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <p class="small text-muted" v-if="!loading && !signedIn.length">No results found.</p>
    <SignedInListItem
      v-for="(item, index) in signedIn"
      :key="index"
      :item="item"
      @click="onSelect(item)"
    ></SignedInListItem>
  </Card>
  <SignOutModal v-model:show="showModal" :loading="signing" @onSubmit="onSubmit" />
</template>

<style scoped lang="scss">
.signed-in-list {
  max-height: 600px;
  overflow-y: auto;
}
</style>

<script setup lang="ts">
import Card from '@/components/base/Card.vue';

import { useLogBookStore } from '@/stores';
import { computed, ref } from 'vue';
import SignedInListItem from '@/components/SignedInListItem.vue';
import SignOutModal from '@/components/SignOutModal.vue';
import type { LogRecord } from '@/types';
import { useToast } from 'vue-toastification';

const logBookStore = useLogBookStore();

const props = defineProps<{
  filter?: string;
}>();

const toast = useToast();

const signing = ref(false);
const showModal = ref(false);
const selectedRecord = ref<LogRecord | null>(null);

const signedIn = computed(() => {
  const text = props.filter?.trim().toLowerCase() || '';
  if (text) {
    return logBookStore.list.filter((item) => {
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
  return logBookStore.list;
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
    logBookStore.fetchList();
  } finally {
    signing.value = false;
  }
};
</script>

<template>
  <Card class="signed-in-list">
    <template #header> People Signed In </template>
    <p class="small text-muted" v-if="!signedIn.length">No results found.</p>
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

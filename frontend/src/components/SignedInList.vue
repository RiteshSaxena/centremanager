<script setup lang="ts">
import { computed, onMounted } from 'vue';

import Card from '@/components/base/Card.vue';
import SignedInListItem from '@/components/SignedInListItem.vue';

import { useLogBookStore, useUserStore } from '@/stores';

const props = defineProps<{
  filter?: string;
  filterId: number | null;
}>();

const emit = defineEmits(['onSelect', 'onFeedback']);

const userStore = useUserStore();
const logBookStore = useLogBookStore();

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

  if (props.filterId) {
    return list.filter((item) => item.student?.id === props.filterId);
  }

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

onMounted(async () => {
  if (!userStore.user) {
    await userStore.fetchMe();
  }
});
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
      v-for="item in signedIn"
      :key="item.id"
      :item="item"
      @onSelect="emit('onSelect', item)"
      @onFeedback="emit('onFeedback', item)"
    />
  </Card>
</template>

<style scoped lang="scss">
.signed-in-list {
  max-height: 600px;
  overflow-y: auto;
}
</style>

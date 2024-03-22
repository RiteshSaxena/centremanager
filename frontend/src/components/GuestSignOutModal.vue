<script setup lang="ts">
import { computed, ref } from 'vue';
import { useToast } from 'vue-toastification';

import { useLogBookStore } from '@/stores';

import Modal from '@/components/base/Modal.vue';
import SignedInListItem from '@/components/SignedInListItem.vue';
import type { LogRecord } from '@/types';

withDefaults(
  defineProps<{
    show: boolean;
  }>(),
  {
    show: false
  }
);

const logBookStore = useLogBookStore();

const loading = ref(false);

const signedIn = computed(() => {
  return logBookStore.list.filter((item) => !item.signOutTime && item.type === 'Guest');
});

const onSelect = (item: LogRecord) => {
  emit('update:show', false);
  emit('onSelect', item);
};

const emit = defineEmits(['update:show', 'onSelect']);
</script>

<template>
  <Modal v-if="show" title="Signed In Guests" @close="emit('update:show', false)">
    <p class="small text-muted" v-if="loading">Loading...</p>
    <p class="small text-muted" v-if="!loading && !signedIn.length">No results found.</p>
    <SignedInListItem
      v-for="item in signedIn"
      :key="item.id"
      :item="item"
      @onSelect="onSelect(item)"
    />
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

import { useLogBookStore } from '@/stores';
import { Button } from '@/components/ui';

const toast = useToast();
const logBookStore = useLogBookStore();

const file = ref<File | null>(null);
const loading = ref(false);

const onSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    file.value = target.files[0];
  }
};

const onSubmit = async () => {
  try {
    if (!file.value) {
      return;
    }
    loading.value = true;
    const data = await logBookStore.importData(file.value);
    toast.success(
      `Data imported successfully! Records added: ${data.created}, updated: ${data.updated}`
    );
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <form class="mt-4 flex flex-col items-start gap-4" @submit.prevent="onSubmit">
    <div>
      <label class="block text-sm font-medium text-secondary-700 mb-2"
        >Select file to import data:</label
      >
      <input
        type="file"
        @change="onSelect"
        accept=".csv"
        required
        class="w-full px-4 py-3 text-sm bg-secondary-50 border border-secondary-300 rounded-xl text-secondary-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-500 file:text-white hover:file:bg-primary-600 file:cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white"
      />
    </div>
    <Button type="submit" :disabled="loading">
      {{ loading ? 'Uploading...' : 'Upload' }}
    </Button>
  </form>
</template>

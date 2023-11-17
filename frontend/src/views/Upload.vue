<script setup lang="ts">
import CentreHeader from '@/components/CentreHeader.vue';

import { useLogBookStore } from '@/stores';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

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
    await logBookStore.importData(file.value);
    toast.success('Data imported successfully');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="pt-4 px-4">
    <CentreHeader />
    <form class="mt-4 d-flex flex-column align-items-start" @submit.prevent="onSubmit">
      <div class="mb-3">
        <label for="formFile" class="form-label">Select file to import data:</label>
        <input
          class="form-control"
          type="file"
          id="formFile"
          @change="onSelect"
          accept=".csv"
          required
        />
      </div>
      <button type="submit" class="btn btn-info" :disabled="loading">
        {{ loading ? 'Uploading...' : 'Upload' }}
      </button>
    </form>
  </div>
</template>

<style scoped lang="scss"></style>

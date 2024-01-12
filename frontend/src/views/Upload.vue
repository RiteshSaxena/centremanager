<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

import { useLogBookStore } from '@/stores';
import InputField from '@/components/base/InputField.vue';

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
  <form class="mt-4 d-flex flex-column align-items-start" @submit.prevent="onSubmit">
    <div class="mb-3">
      <label for="formFile" class="form-label">Select file to import data:</label>
      <InputField type="file" id="formFile" @change="onSelect" accept=".csv" required />
    </div>
    <button type="submit" class="btn btn-info" :disabled="loading">
      {{ loading ? 'Uploading...' : 'Upload' }}
    </button>
  </form>
</template>

<style scoped lang="scss"></style>

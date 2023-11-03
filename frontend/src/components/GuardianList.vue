<script setup lang="ts">
import Card from '@/components/base/Card.vue';
import ChildListItem from '@/components/ChildListItem.vue';
import AddGuardianModal from '@/components/AddGuardianModal.vue';
import { ref } from 'vue';

const showModal = ref(false);
</script>

<template>
  <Card>
    <template #header> Guardians </template>
    <ChildListItem />
    <ChildListItem />
    <button type="button" class="btn btn-secondary" @click="showModal = true">Add Guardian</button>
  </Card>
  <AddGuardianModal v-model:show="showModal" />
</template>

<script setup lang="ts">
import Card from '@/components/base/Card.vue';
import ChildListItem from '@/components/ChildListItem.vue';
</script>

<template>
  <Card>
    <template #header> People Signed In </template>
    <ChildListItem />
    <ChildListItem />
  </Card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: boolean;
  }>(),
  {
    padding: true
  }
);
</script>

<template>
  <div class="bg-white rounded-2xl shadow-card border border-secondary-100 overflow-hidden">
    <div
      v-if="$slots.header"
      class="px-5 py-4 border-b border-secondary-100 bg-secondary-50/50"
    >
      <slot name="header" />
    </div>
    <div :class="padding ? 'p-5' : ''">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="px-5 py-4 border-t border-secondary-100 bg-secondary-50/30"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

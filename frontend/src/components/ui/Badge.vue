<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
    size?: 'sm' | 'md';
  }>(),
  {
    variant: 'neutral',
    size: 'md'
  }
);

const classes = computed(() => {
  const base = 'inline-flex items-center gap-1 font-medium rounded-full border';

  const variants = {
    success: 'bg-success-50 border-success-200 text-success-700',
    danger: 'bg-danger-50 border-danger-200 text-danger-700',
    warning: 'bg-warning-50 border-warning-200 text-warning-700',
    info: 'bg-primary-50 border-primary-200 text-primary-700',
    neutral: 'bg-secondary-50 border-secondary-200 text-secondary-600'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  };

  return [base, variants[props.variant], sizes[props.size]].join(' ');
});
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>

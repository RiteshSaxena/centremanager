<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    block?: boolean;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    type: 'button',
    block: false
  }
);

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500',
    secondary:
      'bg-secondary-200 text-secondary-700 hover:bg-secondary-300 active:bg-secondary-400 focus:ring-secondary-400',
    danger:
      'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus:ring-danger-500',
    ghost:
      'bg-transparent text-secondary-600 hover:bg-secondary-100 active:bg-secondary-200 focus:ring-secondary-400',
    outline:
      'bg-transparent border-2 border-primary-500 text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2.5 text-sm min-h-touch',
    lg: 'px-6 py-3 text-base min-h-[52px]'
  };

  return [base, variants[props.variant], sizes[props.size], props.block ? 'w-full' : ''].join(' ');
});
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading">
    <svg
      v-if="loading"
      class="animate-spin -ml-1 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <slot />
  </button>
</template>

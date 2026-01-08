<script setup lang="ts">
import { computed } from 'vue';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    options: SelectOption[];
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    placeholder: 'Select an option',
    label: '',
    error: '',
    disabled: false
  }
);

const emit = defineEmits(['update:modelValue']);

const classes = computed(() => {
  const base =
    'w-full px-4 py-3 text-sm bg-secondary-50 border rounded-xl text-secondary-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer pr-10';

  const states = props.error
    ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20'
    : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20';

  return [base, states].join(' ');
});

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-secondary-700 mb-1.5">
      {{ label }}
    </label>
    <div class="relative">
      <select
        :value="modelValue"
        :disabled="disabled"
        :class="classes"
        @change="handleChange"
      >
        <option value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          class="w-5 h-5 text-secondary-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
    <p v-if="error" class="mt-1.5 text-sm text-danger-500">
      {{ error }}
    </p>
  </div>
</template>

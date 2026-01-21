<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    readonly?: boolean;
    rows?: number;
  }>(),
  {
    modelValue: '',
    placeholder: '',
    label: '',
    error: '',
    disabled: false,
    readonly: false,
    rows: 4
  }
);

const emit = defineEmits(['update:modelValue', 'blur', 'focus']);

const classes = computed(() => {
  const base =
    'w-full px-4 py-3 text-sm bg-secondary-50 border rounded-xl text-secondary-900 placeholder:text-secondary-400 transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-0 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed resize-none';

  const states = props.error
    ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20'
    : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20';

  return [base, states].join(' ');
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-secondary-700 mb-1.5">
      {{ label }}
    </label>
    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      :class="classes"
      @input="handleInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />
    <p v-if="error" class="mt-1.5 text-sm text-danger-500">
      {{ error }}
    </p>
  </div>
</template>

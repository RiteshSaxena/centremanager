<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'search' | 'date';
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    readonly?: boolean;
    autocomplete?: string;
    inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
    maxlength?: number;
  }>(),
  {
    modelValue: '',
    type: 'text',
    placeholder: '',
    label: '',
    error: '',
    disabled: false,
    readonly: false,
    autocomplete: 'off'
  }
);

const emit = defineEmits(['update:modelValue', 'blur', 'focus']);

const inputClasses = computed(() => {
  const base =
    'w-full px-4 py-3 text-sm bg-secondary-50 border rounded-xl text-secondary-900 placeholder:text-secondary-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed';

  const states = props.error
    ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20'
    : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20';

  return [base, states].join(' ');
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-secondary-700 mb-1.5">
      {{ label }}
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :maxlength="maxlength"
      :class="inputClasses"
      @input="handleInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />
    <p v-if="error" class="mt-1.5 text-sm text-danger-500">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    label?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: false,
    label: '',
    disabled: false
  }
);

const emit = defineEmits(['update:modelValue']);

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
};
</script>

<template>
  <label class="inline-flex items-center gap-3 cursor-pointer select-none" :class="{ 'opacity-50 cursor-not-allowed': disabled }">
    <div class="relative">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="peer sr-only"
        @change="handleChange"
      />
      <div
        class="w-5 h-5 border-2 rounded-md transition-all duration-200 border-secondary-300 bg-white peer-checked:border-primary-500 peer-checked:bg-primary-500 peer-focus:ring-2 peer-focus:ring-primary-500/20 peer-focus:ring-offset-1"
      >
        <svg
          class="w-full h-full text-white opacity-0 peer-checked:opacity-100 transition-opacity"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <svg
        class="absolute top-0 left-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
    <span v-if="label" class="text-sm text-secondary-700">{{ label }}</span>
    <slot />
  </label>
</template>

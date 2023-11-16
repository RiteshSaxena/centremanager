<script setup lang="ts">
withDefaults(
  defineProps<{
    placeholder?: string;
    type?: string;
    required?: boolean;
    modelValue: string;
  }>(),
  {
    placeholder: '',
    type: 'text',
    required: false
  }
);

const emit = defineEmits(['update:modelValue']);

const onInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
};
</script>

<template>
  <input
    :type="type"
    class="form-control"
    :placeholder="placeholder"
    :aria-label="placeholder"
    :required="required"
    :value="modelValue"
    @input="onInput"
  />
</template>

<style scoped lang="scss">
input.form-control {
  background: #e5e5e5;
  color: #193b4d;
  font-size: 14px;
  line-height: 21px;
  border-radius: 10px;
  height: 40px;

  &::placeholder {
    color: #9e9e9e;
    font-size: 14px;
    line-height: 21px;
    border-radius: 10px;
  }
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type='number'] {
  -moz-appearance: textfield;
}

.form-control:focus {
  box-shadow: none;
  border-color: #193b4d;
}
</style>

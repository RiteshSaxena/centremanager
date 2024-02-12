<script setup lang="ts">
withDefaults(
  defineProps<{
    placeholder?: string;
    type?: string;
    required?: boolean;
    modelValue?: string;
    isFloating?: boolean;
    isWhite?: boolean;
    hasDarkPlaceholder?: boolean;
    label?: '';
  }>(),
  {
    placeholder: '',
    type: 'text',
    required: false,
    isFloating: false,
    label: '',
    isWhite: false,
    hasDarkPlaceholder: false
  }
);

const emit = defineEmits(['update:modelValue']);

const onInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
};
</script>

<template>
  <div
    class="field-container"
    :class="{
      'form-floating': isFloating,
      'form-white': isWhite,
      'form-has-dark-placeholder': hasDarkPlaceholder
    }"
  >
    <label v-if="label && !isFloating">{{ label }}</label>
    <input
      :type="type"
      class="form-control"
      :placeholder="placeholder"
      :required="required"
      :value="modelValue"
      @input="onInput"
    />
    <label v-if="isFloating">{{ placeholder }}</label>
  </div>
</template>

<style scoped lang="scss">
.field-container {
  flex: 1;

  .form-control {
    background: #e5e5e5;
    color: #193b4d;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &[type='number'] {
      appearance: textfield;
      -moz-appearance: textfield;
    }

    &:focus {
      box-shadow: none;
      border-color: #193b4d;
    }
  }
}

.field-container.form-floating {
  label {
    color: #9e9e9e;
  }

  .form-control {
    border-radius: 12px;

    &:focus ~ label::after,
    &:not(:placeholder-shown) ~ label::after {
      background: #e5e5e5;
    }
  }

  &.form-has-dark-placeholder {
    label {
      color: #193b4d;
      font-weight: 500;
    }
  }
}

.field-container:not(.form-floating) {
  input.form-control {
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

    &[type='file'] {
      height: 35px;
    }
  }

  &.form-has-dark-placeholder {
    input.form-control::placeholder {
      color: #193b4d;
      font-weight: 500;
    }
  }
}

.field-container.form-white {
  .form-control {
    background: #fff;
    color: #193b4d;

    &:focus ~ label::after,
    &:not(:placeholder-shown) ~ label::after {
      background: #fff;
    }
  }
}
</style>

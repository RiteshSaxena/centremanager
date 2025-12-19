<script setup lang="ts">
import type { LogRecord } from '@/types';

import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

import { useLogBookStore } from '@/stores';

import Modal from '@/components/base/Modal.vue';
// import SignaturePad from '@/components/SignaturePad.vue';

const props = withDefaults(
  defineProps<{
    show: boolean;
    item: LogRecord | null;
    // isQrMode?: boolean;
  }>(),
  {
    show: false,
    item: null,
    // isQrMode: false
  }
);

const emit = defineEmits(['update:show', 'onSuccess']);

const toast = useToast();
const logBookStore = useLogBookStore();

const qrMode = ref(false);
const loading = ref(false);
// const signaturePad = ref<typeof SignaturePad | null>(null);

watch(
  () => props.show,
  (val) => {
    if (val) {
    
      // signaturePad.value?.reset();
    }
  }
);
function onScoreInput(e: Event) {
  const input = e.target as HTMLInputElement;
  let v = input.value;

  if (v === "-") {
    return;
  }

  v = v.replace(/[^0-9\-\.\%]/g, '');

  v = v.replace(/(?!^)-/g, '');

  const hasPercent = v.endsWith('%');
  v = v.replace('%', '');

  let num = Number(v);
  if (isNaN(num)) {
    input.value = "";
    return;
  }

  if (num > 100) num = 100;

  if (num < 0) {
    input.value = num.toString();
    return;
  }
  input.value = num.toString() + "%";
}
const selectedName = computed(() => {
  if (props.item) {
    if (
      props.item.type === 'Student' ||
      props.item.type === 'StudentWithParent' ||
      props.item.type === 'Parent'
    ) {
      if (props.item.student) {
        return `${props.item.student.firstName} ${props.item.student.lastName} (${props.item.parent?.firstName} ${props.item.parent?.lastName})`;
      }
      return `${props.item.parent?.firstName} ${props.item.parent?.lastName}`;
    } else if (props.item?.type === 'Staff') {
      return `${props.item.staff?.firstName} ${props.item.staff?.lastName}`;
    } else if (props.item?.type === 'Guest') {
      return `${props.item.guest?.firstName} ${props.item.guest?.lastName}`;
    }
  }

  return '';
});
</script>

<template>
  <Modal
    :large="false"
    v-if="show"
    :show-footer-close-button="!qrMode"
    :title="`Feedback  - ${selectedName}`"
    @close="emit('update:show', false)"
  >
    <div class="w-100 fs-5 text-center d-flex flex-column gap-2">
      <div class="row">
        <div class="col-4"></div>
        <div class="col-4"><strong>Score</strong></div>
        <div class="col-4"><strong>Time <small>(M)</small></strong></div>
      </div>
      <div class="row">
        <div class="col-4">
          <span><b>Maths</b></span>
        </div>
        <div class="col-4">
          <input type="text" name="score" inputmode="numeric" pattern="[0-9]*" maxlength="4" @input="onScoreInput" class="form-control">
        </div>
        <div class="col-4">
          <input type="text" name="time"  inputmode="numeric" pattern="[0-9]*" maxlength="2" class="form-control">
        </div>
      </div>
      <div class="row">
        <div class="col-4">
          <span><b>Eng</b></span>
        </div>
        <div class="col-4">
          <input type="text" name="score" inputmode="numeric" pattern="[0-9]*" maxlength="4" @input="onScoreInput"  class="form-control">
        </div>
        <div class="col-4">
          <input type="text" name="time"  inputmode="numeric" pattern="[0-9]*" maxlength="2" class="form-control">
        </div>
      </div>
      <div class="row">
        <div class="col-12 align-items-start justify-content-start d-flex">
          <label><b>Feedback</b></label>
        </div>
        <div class="col-12">
          <textarea name="" class="form-control" rows="7" id=""></textarea>
        </div>
        <label for="inperson" class="text-start mt-2">
          <input type="checkbox" name="inperson" id="inperson">
          In person feedback required.
        </label>
      </div>
    </div>

    <template #footer>
      <button
        v-if="!qrMode"
        type="button"
        class="btn btn-info"
        :disabled="loading"
      >
        {{ loading ? '...' : 'Submit' }}
      </button>
    </template>
  </Modal>
</template>

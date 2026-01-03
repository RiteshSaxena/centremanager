<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { Modal } from 'bootstrap';

withDefaults(
  defineProps<{
    title?: string;
    showFooterCloseButton?: boolean;
    closeOnOutside?: boolean;
    closeOnKeyboard?: boolean;
    large?: boolean;
  }>(),
  {
    title: '',
    showFooterCloseButton: true,
    closeOnBackdrop: true,
    closeOnKeyboard: true,
    large: false
  }
);

const emit = defineEmits(['close']);

const modalRef = ref<HTMLElement | null>(null);
let modalIns: any = null;

onMounted(() => {
  modalIns = new Modal(modalRef.value as any);
  modalIns.show();
  modalRef.value?.addEventListener('hide.bs.modal', () => {
    emit('close');
  });
});

onBeforeUnmount(() => {
  modalIns?.hide();
});
</script>

<template>
  <Teleport to="#modals">
    <div
      class="modal fade"
      ref="modalRef"
      :data-bs-backdrop="closeOnOutside ? 'true' : 'static'"
      :data-bs-keyboard="closeOnKeyboard ? 'true' : 'false'"
    >
      <div class="modal-dialog modal-dialog-centered" :class="{ 'modal-lg': large }">
        <div class="modal-content">
          <div class="modal-header">
            <!-- <h5 class="modal-title">{{ title }}</h5> -->
            <h5 class="modal-title">
              <slot name="title">
                {{ title }}
              </slot>
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer">
            <button
              v-if="showFooterCloseButton"
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.modal {
  border-radius: 10px;
}

.modal-header,
.modal-footer {
  border: none;
}
</style>

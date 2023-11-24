<script setup lang="ts">
import QrScanner from 'qr-scanner';
import { ref, watch } from 'vue';

import Modal from '@/components/base/Modal.vue';

const props = withDefaults(
  defineProps<{
    show: boolean;
  }>(),
  {
    show: false
  }
);

const emit = defineEmits(['update:show', 'student']);

let qrScannerIns: any = null;
const isScanning = ref(false);
const permissionError = ref(false);

const onScanCompleted = async (result: QrScanner.ScanResult) => {
  if (result) {
    const { data } = result;
    console.log(data);
    const dataArr = data.trim().split('-');
    if (dataArr.length < 2) {
      window.alert('Invalid QR code');
      return;
    }
    console.log(dataArr);
    if (dataArr[0] === 'student') {
      emit('student', parseInt(dataArr[1]));
    }
    emit('update:show', false);
  }
};

const checkPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true
    });
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    return true;
  } catch (err: any) {
    return false;
  }
};

const startScan = async () => {
  try {
    const hasPermission = await checkPermission();
    permissionError.value = false;

    if (!hasPermission) {
      permissionError.value = true;
      return;
    }

    const video = document.getElementById('qr-scanner') as HTMLVideoElement;
    qrScannerIns = new QrScanner(video, onScanCompleted, {
      returnDetailedScanResult: true,
      maxScansPerSecond: 1,
      highlightScanRegion: true,
      preferredCamera: 'environment',
      onDecodeError: (err) => {
        if (typeof err === 'string' && !err.includes('No QR code found')) {
          window.alert(err);
        }
      }
    });

    isScanning.value = true;
    await qrScannerIns?.start();
  } catch (err) {
    window.alert((err as any).message);
  }
};

const stopScan = () => {
  isScanning.value = false;
  qrScannerIns?.stop();
};

watch(
  () => props.show,
  (show) => {
    if (show) {
      startScan();
    } else {
      stopScan();
    }
  }
);
</script>

<template>
  <Modal v-if="show" :close-on-outside="false" title="Scan QR" @close="emit('update:show', false)">
    <div v-if="!permissionError && !isScanning">
      <p>Initializing camera...</p>
    </div>
    <div v-if="permissionError">
      <p>Unable to access camera. Please allow camera access in your settings.</p>
      <button class="btn btn-info" @click="startScan">Retry</button>
    </div>
    <video
      id="qr-scanner"
      autoplay
      :class="{ 'qr-scanner': true, 'qr-scanner-hide': !isScanning }"
    />
  </Modal>
</template>

<style scoped>
.qr-scanner {
  height: 100%;
  width: 100%;
}
.qr-scanner.qr-scanner-hide {
  height: 0;
  width: 0;
}
</style>

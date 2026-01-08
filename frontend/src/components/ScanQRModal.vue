<script setup lang="ts">
import QrScanner from 'qr-scanner';
import { ref, watch } from 'vue';

import { Modal, Button } from '@/components/ui';

const props = withDefaults(
  defineProps<{
    show: boolean;
  }>(),
  {
    show: false
  }
);

const isKioskApp = APP_TYPE === 'app-kiosk';

const emit = defineEmits(['update:show', 'student']);

let qrScannerIns: any = null;
const isScanning = ref(false);
const permissionError = ref(false);

const onScanCompleted = async (result: QrScanner.ScanResult) => {
  if (result) {
    const { data } = result;

    const dataArr = data.trim().split('-');
    if (dataArr.length < 2) {
      window.alert('Invalid QR code');
      return;
    }

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
      maxScansPerSecond: 5,
      highlightScanRegion: true,
      preferredCamera: isKioskApp ? 'user' : 'environment',
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
  <Modal :open="show" :closable="true" title="Scan QR" @close="emit('update:show', false)">
    <div v-if="!permissionError && !isScanning">
      <p class="text-secondary-600">Initializing camera...</p>
    </div>
    <div v-if="permissionError">
      <p class="text-secondary-600 mb-3">Unable to access camera. Please allow camera access in your settings.</p>
      <Button @click="startScan">Retry</Button>
    </div>
    <video
      id="qr-scanner"
      autoplay
      :class="['w-full h-full', !isScanning ? 'w-0 h-0' : '']"
    />

    <template #footer>
      <Button variant="outline" size="lg" class="w-full" @click="emit('update:show', false)">
        Cancel
      </Button>
    </template>
  </Modal>
</template>

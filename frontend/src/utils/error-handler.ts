import { useToast } from 'vue-toastification';

const errorHandler = (err: any) => {
  const toast = useToast();
  console.error(err);
  if (err?.response?.data?.error?.message) {
    toast.error(err.response.data.error.message);
  } else if (err?.response?.data?.message) {
    toast.error(err.response.data.message);
  } else if (err?.response?.data?.data?.message) {
    toast.error(err.response.data.data.message);
  } else {
    toast.error(err.message);
  }
};

export default errorHandler;

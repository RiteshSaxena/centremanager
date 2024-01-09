import { useToast } from 'vue-toastification';
import { AxiosError } from 'axios';

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

  if (err instanceof AxiosError && err.response?.data) {
    const tokenErrors = ['Missing or invalid credentials', 'Invalid credentials'];
    if (err.response.status === 401 && tokenErrors.includes(err.response.data.error.message)) {
      localStorage.removeItem('token');
      window.location.reload();
    }
  }
};

export default errorHandler;

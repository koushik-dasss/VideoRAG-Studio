import toast from 'react-hot-toast';

export const NotificationService = {
  success: (message) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  },
  error: (message) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
    });
  },
  info: (message) => {
    toast(message, {
      icon: 'ℹ️',
      duration: 3000,
      position: 'top-right',
    });
  },
  loading: (message) => {
    return toast.loading(message, {
      position: 'top-right',
    });
  },
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  }
};

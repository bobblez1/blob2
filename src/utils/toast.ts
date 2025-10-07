"use client";

import toast from 'react-hot-toast';

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showInfo = (message: string) => {
  toast(message); // Default toast for info
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

export const updateToast = (toastId: string, message: string, type: 'success' | 'error' | 'loading' | 'blank') => {
  toast.remove(toastId); // Remove existing toast
  if (type === 'success') {
    toast.success(message);
  } else if (type === 'error') {
    toast.error(message);
  } else if (type === 'loading') {
    toast.loading(message);
  } else {
    toast(message);
  }
};
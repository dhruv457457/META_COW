import toast from "react-hot-toast";

// Toast configuration
const toastConfig = {
  duration: 4000,
  position: "top-right",
  style: {
    borderRadius: "10px",
    background: "#333",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    padding: "12px 16px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
  },
};

// Success toast
export const showSuccess = (message) => {
  toast.success(message, {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      background: "#10b981",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#10b981",
    },
  });
};

// Error toast
export const showError = (message) => {
  toast.error(message, {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      background: "#ef4444",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#ef4444",
    },
  });
};

// Info toast
export const showInfo = (message) => {
  toast(message, {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      background: "#3b82f6",
    },
    icon: "ℹ️",
  });
};

// Warning toast
export const showWarning = (message) => {
  toast(message, {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      background: "#f59e0b",
    },
    icon: "⚠️",
  });
};

// Loading toast
export const showLoading = (message) => {
  return toast.loading(message, {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      background: "#6b7280",
    },
  });
};

// Dismiss toast
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

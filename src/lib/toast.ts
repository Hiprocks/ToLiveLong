export type ToastType = "success" | "info" | "error";

export type ToastPayload = {
  message: string;
  type?: ToastType;
};

const TOAST_EVENT = "to-live-long:toast";

export const showToast = (payload: ToastPayload) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
};

export const toastEventName = TOAST_EVENT;

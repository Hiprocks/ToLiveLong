import { useEffect, useEffectEvent } from "react";

/**
 * PWA back-button policy for modal/sheet UIs.
 *
 * When a modal opens, it pushes a dummy history entry.
 * Back button closes the topmost modal first instead of leaving the page.
 */
type ModalHandler = () => void;

const modalStack: ModalHandler[] = [];
const MODAL_STATE_KEY = "__modalHistoryKey";
let suppressNextPopState = false;
let listenerInstalled = false;
let popstateClosingDepth = 0;

function installGlobalListener() {
  if (listenerInstalled) return;
  listenerInstalled = true;

  window.addEventListener("popstate", () => {
    if (suppressNextPopState) {
      suppressNextPopState = false;
      return;
    }

    const handler = modalStack.pop();
    if (!handler) return;

    popstateClosingDepth += 1;
    try {
      handler();
    } finally {
      queueMicrotask(() => {
        popstateClosingDepth = Math.max(0, popstateClosingDepth - 1);
      });
    }
  });
}

export function useModalHistory(isOpen: boolean, onClose: () => void): void {
  const handleClose = useEffectEvent(onClose);

  useEffect(() => {
    if (typeof window === "undefined") return;
    installGlobalListener();
    if (!isOpen) return;

    const stateKey = `__modal_${Date.now()}_${Math.random()}`;
    const currentState =
      window.history.state && typeof window.history.state === "object"
        ? (window.history.state as Record<string, unknown>)
        : {};

    window.history.pushState(
      {
        ...currentState,
        [MODAL_STATE_KEY]: stateKey,
      },
      ""
    );

    const handler: ModalHandler = () => handleClose();
    modalStack.push(handler);

    return () => {
      const index = modalStack.lastIndexOf(handler);
      if (index === -1) return;

      modalStack.splice(index, 1);

      // If this close was triggered by popstate, do not call back() again.
      if (popstateClosingDepth > 0) return;

      // For explicit close (button / Escape), remove our own dummy entry only.
      queueMicrotask(() => {
        if ((window.history.state as Record<string, unknown> | null)?.[MODAL_STATE_KEY] !== stateKey) {
          return;
        }
        suppressNextPopState = true;
        window.history.back();
      });
    };
  }, [isOpen]);
}

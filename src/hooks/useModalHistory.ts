import { useEffect, useEffectEvent } from "react";

/**
 * PWA 뒤로가기 정책 훅
 *
 * 모달/시트가 열릴 때 history에 더미 엔트리를 추가하고,
 * 뒤로가기 버튼이 눌리면 실제 페이지 이탈 대신 모달을 닫는다.
 * 중첩 모달은 스택 순서대로 가장 위의 모달부터 단계적으로 닫힌다.
 *
 * @param isOpen 모달 열림 상태
 * @param onClose 닫기 콜백 (항상 최신 참조 사용)
 */

type ModalHandler = () => void;

const modalStack: ModalHandler[] = [];
const MODAL_STATE_KEY = "__modalHistoryKey";
let suppressNextPopState = false;
let listenerInstalled = false;

function installGlobalListener() {
  if (listenerInstalled) return;
  listenerInstalled = true;
  window.addEventListener("popstate", () => {
    if (suppressNextPopState) {
      suppressNextPopState = false;
      return;
    }
    const handler = modalStack.pop();
    handler?.();
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
      if (index !== -1) {
        modalStack.splice(index, 1);
        // 버튼/Escape로 닫힌 경우에는 history.back()으로 더미 엔트리를 정리한다.
        // 다만 같은 커밋에서 다른 모달이 즉시 열리는 전환 흐름이 있어,
        // 현재 엔트리가 그대로 유지되는 경우에만 back을 실행해야 한다.
        queueMicrotask(() => {
          if ((window.history.state as Record<string, unknown> | null)?.[MODAL_STATE_KEY] !== stateKey) {
            return;
          }
          suppressNextPopState = true;
          window.history.back();
        });
      }
    };
  }, [isOpen]);
}

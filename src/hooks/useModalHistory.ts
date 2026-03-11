import { useEffect, useRef } from "react";

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
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (typeof window === "undefined") return;
    installGlobalListener();
    if (!isOpen) return;

    const stateKey = `__modal_${Date.now()}_${Math.random()}`;
    window.history.pushState({ modalKey: stateKey }, "");

    const handler: ModalHandler = () => onCloseRef.current();
    modalStack.push(handler);

    return () => {
      const index = modalStack.lastIndexOf(handler);
      if (index !== -1) {
        modalStack.splice(index, 1);
        // 버튼/Escape로 닫힌 경우: 더미 히스토리 엔트리 제거
        if ((window.history.state as Record<string, unknown> | null)?.modalKey === stateKey) {
          suppressNextPopState = true;
          window.history.back();
        }
      }
    };
  }, [isOpen]);
}

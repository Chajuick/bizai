import { useState, useCallback } from "react";
import type { ProcessingOverlayProps } from "@/components/focuswin/common/overlays/processing-overlay";

/**
 * ProcessingOverlay 상태를 관리하는 훅
 *
 * 사용 예:
 *   const { showOverlay, hideOverlay, overlayProps } = useProcessingOverlay();
 *
 *   showOverlay("영업일지를 분석 중입니다...");
 *   // ... 비동기 작업 ...
 *   hideOverlay();
 *
 *   return <ProcessingOverlay {...overlayProps} />;
 */
export function useProcessingOverlay() {
  const [overlayProps, setOverlayProps] = useState<ProcessingOverlayProps>({
    visible: false,
  });

  const showOverlay = useCallback((message?: string) => {
    setOverlayProps({ visible: true, message });
  }, []);

  const hideOverlay = useCallback(() => {
    setOverlayProps({ visible: false });
  }, []);

  return { showOverlay, hideOverlay, overlayProps };
}

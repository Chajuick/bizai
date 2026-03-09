import { Loader2 } from "lucide-react";

export interface ProcessingOverlayProps {
  visible: boolean;
  message?: string;
}

/**
 * 전체 화면 로딩 오버레이 — 비동기 처리 진행 중 사용자 상호작용 차단
 *
 * 사용 예:
 *   const { showOverlay, hideOverlay, overlayProps } = useProcessingOverlay();
 *   showOverlay("영업일지를 분석 중입니다...");
 *   <ProcessingOverlay {...overlayProps} />
 */
export default function ProcessingOverlay({ visible, message }: ProcessingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white px-10 py-7 shadow-2xl">
        <Loader2 size={36} className="animate-spin text-blue-500" />
        <p className="text-sm font-semibold text-slate-700">
          {message ?? "처리 중입니다..."}
        </p>
      </div>
    </div>
  );
}

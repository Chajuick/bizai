// components/focuswin/page/sale/regist/SaleRegistModals.tsx

import type { PreSaveState } from "@/types/sale";
import type { PostAnalyzeClientState } from "@/types/ai";

import SaleRegistPreSaveClientDialog from "./PreSaveClientModal";
import PostAnalyzeClientModal from "@/components/focuswin/page/sale/common/PostAnalyzeClientModal";

// #region Types

export type SaleRegistModalsProps = {
  // ─── 프리세이브 거래처 확인 다이얼로그 ──────────────────────────────────
  preSaveState: PreSaveState | null;
  onPreSaveConfirm: () => Promise<void>;
  onPreSaveDeny: () => Promise<void>;

  // ─── AI 분석 후 거래처 연결 모달 ──────────────────────────────────────
  postAnalyzeClientState: PostAnalyzeClientState;
  onPostAnalyzeConfirm: () => Promise<void>;
  onPostAnalyzeDeny: () => Promise<void>;
};

// #endregion

// #region Component

/**
 * 영업일지 등록 페이지 모달 모음.
 * VM은 상태/핸들러만 제공하고, 이 컴포넌트가 JSX 조립 담당.
 */
export function SaleRegistModals({
  preSaveState,
  onPreSaveConfirm,
  onPreSaveDeny,
  postAnalyzeClientState,
  onPostAnalyzeConfirm,
  onPostAnalyzeDeny,
}: SaleRegistModalsProps) {
  return (
    <>
      <SaleRegistPreSaveClientDialog
        open={!!preSaveState}
        typedName={preSaveState?.typedName}
        matchedName={preSaveState?.matchedName}
        onConfirm={onPreSaveConfirm}
        onDeny={onPreSaveDeny}
      />

      <PostAnalyzeClientModal
        open={!!postAnalyzeClientState}
        ai_client_name={postAnalyzeClientState?.ai_client_name ?? ""}
        matched_name={postAnalyzeClientState?.matched_name ?? null}
        onConfirm={onPostAnalyzeConfirm}
        onDeny={onPostAnalyzeDeny}
      />
    </>
  );
}

// #endregion

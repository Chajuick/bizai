// components/focuswin/page/sale/detail/SaleDetailModals.tsx

import type { Dispatch, SetStateAction } from "react";
import type { ConfirmState } from "@/components/focuswin/common/overlays/confirm-action-dialog";
import type { PostAnalyzeClientState } from "@/types/ai";

import ConfirmActionDialog from "@/components/focuswin/common/overlays/confirm-action-dialog";
import PostAnalyzeClientModal from "@/components/focuswin/page/sale/common/PostAnalyzeClientModal";

// #region Types

export type SaleDetailModalsProps = {
  // ─── 삭제 확인 다이얼로그 ─────────────────────────────────────────────
  confirm: ConfirmState;
  setConfirm: Dispatch<SetStateAction<ConfirmState>>;
  onConfirm: (c: NonNullable<ConfirmState>) => Promise<void>;

  // ─── AI 분석 후 거래처 연결 모달 ──────────────────────────────────────
  postAnalyzeClientState: PostAnalyzeClientState;
  onPostAnalyzeConfirm: () => Promise<void>;
  onPostAnalyzeDeny: () => Promise<void>;
};

// #endregion

// #region Component

/**
 * 영업일지 상세 페이지 모달 모음.
 * VM은 상태/핸들러만 제공하고, 이 컴포넌트가 JSX 조립 담당.
 */
export function SaleDetailModals({
  confirm,
  setConfirm,
  onConfirm,
  postAnalyzeClientState,
  onPostAnalyzeConfirm,
  onPostAnalyzeDeny,
}: SaleDetailModalsProps) {
  return (
    <>
      <ConfirmActionDialog
        confirm={confirm}
        setConfirm={setConfirm}
        onConfirm={onConfirm}
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

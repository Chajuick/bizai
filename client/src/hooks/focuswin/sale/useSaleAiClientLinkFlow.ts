// src/hooks/focuswin/sale/useSaleAiClientLinkFlow.tsx

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { handleApiError } from "@/lib/handleApiError";
import type { PostAnalyzeClientState, AiContact } from "@/types/ai";

// #region Types

type AnalyzeResult = {
  ai_client_name?: string | null;
  matched_client_idno?: number | null;
  matched_client_name?: string | null;
  ai_contacts?: AiContact[];
  schedule_idno?: number | null;
};

// #endregion

export function useSaleAiClientLinkFlow() {
  // #region TRPC

  const utils = trpc.useUtils();

  const updateSale = trpc.crm.sale.update.useMutation();
  const patchScheduleClient = trpc.crm.sale.patchScheduleClient.useMutation();
  const findOrCreateClient = trpc.crm.client.findOrCreate.useMutation();
  const syncClientContacts = trpc.crm.client.syncContacts.useMutation();

  // #endregion

  // #region State

  const [postAnalyzeClientState, setPostAnalyzeClientState] =
    useState<PostAnalyzeClientState>(null);

  const [pendingSaleId, setPendingSaleId] = useState<number | null>(null);

  // #endregion

  // #region Helpers

  /**
   * AI가 추출한 연락처를 거래처로 동기화합니다.
   * - 연락처 동기화 실패는 주요 플로우를 막지 않도록 조용히 무시합니다.
   */
  const syncContactsToClient = async (clie_idno: number, contacts: AiContact[]) => {
    if (!contacts.length) return;
    try {
      await syncClientContacts.mutateAsync({ clie_idno, contacts });
    } catch {
      // no-op
    }
  };

  const closePostAnalyzeModal = () => {
    setPostAnalyzeClientState(null);
    setPendingSaleId(null);
  };

  // #endregion

  // #region Decision

  /**
   * analyze 결과를 보고 "거래처 연결 모달"을 띄울지 결정합니다.
   * - 이미 거래처(clie_idno)가 연결된 경우: 열지 않음
   * - ai_client_name이 없는 경우: 열지 않음
   * - 조건 만족 시: 모달 state 세팅 후 true 반환
   */
  const maybeOpenPostAnalyzeModal = (
    saleId: number,
    analyzeResult: AnalyzeResult,
    hasClientLinked: boolean,
  ) => {
    const aiName = analyzeResult.ai_client_name ?? null;

    console.log("[maybeOpenPostAnalyzeModal] input", {
      saleId,
      analyzeResult,
      hasClientLinked,
      aiName,
    });

    if (!aiName) {
      console.log("[maybeOpenPostAnalyzeModal] blocked: no ai_client_name");
      return false;
    }

    if (hasClientLinked) {
      console.log("[maybeOpenPostAnalyzeModal] blocked: already linked");
      return false;
    }

    setPendingSaleId(saleId);
    setPostAnalyzeClientState({
      ai_client_name: aiName,
      matched_idno: analyzeResult.matched_client_idno ?? null,
      matched_name: analyzeResult.matched_client_name ?? null,
      ai_contacts: analyzeResult.ai_contacts ?? [],
    });

    console.log("[maybeOpenPostAnalyzeModal] opened", {
      saleId,
      ai_client_name: aiName,
      matched_idno: analyzeResult.matched_client_idno ?? null,
      matched_name: analyzeResult.matched_client_name ?? null,
    });

    return true;
  };

  // #endregion

  // #region Handlers

  /**
   * 모달: "맞아요"
   * - 매칭 거래처가 있으면: 해당 거래처로 연결
   * - 없으면: 신규 거래처 생성 후 연결
   */
  const confirmPostAnalyze = async () => {
    if (!postAnalyzeClientState || !pendingSaleId) return;

    const state = postAnalyzeClientState;
    const saleId = pendingSaleId;

    closePostAnalyzeModal();

    try {
      if (state.matched_idno) {
        await updateSale.mutateAsync({
          sale_idno: saleId,
          clie_idno: state.matched_idno,
          clie_name: state.matched_name ?? undefined,
        });
        await patchScheduleClient.mutateAsync({
          sale_idno: saleId,
          clie_idno: state.matched_idno,
          clie_name: state.matched_name ?? undefined,
        });

        await syncContactsToClient(state.matched_idno, state.ai_contacts);
        toast.success(`거래처 '${state.matched_name}'에 연결되었습니다.`);
        return saleId;
      }

      const client = await findOrCreateClient.mutateAsync({ name: state.ai_client_name });
      if (!client) return saleId;

      await updateSale.mutateAsync({
        sale_idno: saleId,
        clie_idno: client.clie_idno,
        clie_name: client.clie_name,
      });
      await patchScheduleClient.mutateAsync({
        sale_idno: saleId,
        clie_idno: client.clie_idno,
        clie_name: client.clie_name,
      });

      await syncContactsToClient(client.clie_idno, state.ai_contacts);
      await utils.crm.client.list.invalidate();
      toast.success(`'${client.clie_name}'을(를) 신규 거래처로 등록하고 연결했습니다.`);

      return saleId;
    } catch (e) {
      handleApiError(e);
      return saleId;
    }
  };

  /**
   * 모달: "아니에요(새로 추가)" / "스킵"
   * - 기존 매칭이 있으면: ai_client_name으로 신규 생성 후 연결
   * - 매칭도 없으면: 스킵 처리
   */
  const denyPostAnalyze = async () => {
    if (!postAnalyzeClientState || !pendingSaleId) return;

    const state = postAnalyzeClientState;
    const saleId = pendingSaleId;

    closePostAnalyzeModal();

    try {
      if (!state.matched_idno) {
        toast.info("거래처 연결을 건너뛰었습니다.");
        return saleId;
      }

      const client = await findOrCreateClient.mutateAsync({ name: state.ai_client_name });
      if (!client) return saleId;

      await updateSale.mutateAsync({
        sale_idno: saleId,
        clie_idno: client.clie_idno,
        clie_name: client.clie_name,
      });
      await patchScheduleClient.mutateAsync({
        sale_idno: saleId,
        clie_idno: client.clie_idno,
        clie_name: client.clie_name,
      });

      await syncContactsToClient(client.clie_idno, state.ai_contacts);
      await utils.crm.client.list.invalidate();
      toast.success(`'${client.clie_name}'을(를) 신규 거래처로 등록하고 연결했습니다.`);

      return saleId;
    } catch (e) {
      handleApiError(e);
      return saleId;
    }
  };

  // #endregion

  return {
    // state
    postAnalyzeClientState,

    // decision
    maybeOpenPostAnalyzeModal,

    // handlers
    confirmPostAnalyze,
    denyPostAnalyze,
    closePostAnalyzeModal,
  };
}
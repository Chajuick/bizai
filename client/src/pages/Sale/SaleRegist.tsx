import { useSaleRegistViewModel } from "@/hooks/focuswin/sale/useSaleRegistViewModel";

import SaleRegistPreSaveClientDialog from "@/components/focuswin/sale/regist/PreSaveClientModal";
import PostAnalyzeClientModal from "@/components/focuswin/sale/common/PostAnalyzeClientModal";

import PageScaffold from "@/components/focuswin/common/page-scaffold";
import SaleRegistContent from "@/components/focuswin/sale/regist/Content";
import SaleRegistAnalysisBanner from "@/components/focuswin/sale/regist/AnalysisBanner";

export default function SaleRegist() {
  const vm = useSaleRegistViewModel();

  return (
    <>
      {/* 저장 전 고객사 확인 */}
      <SaleRegistPreSaveClientDialog
        open={!!vm.preSaveState}
        typedName={vm.preSaveState?.typedName}
        matchedName={vm.preSaveState?.matchedName}
        onConfirm={vm.handlePreSaveConfirm}
        onDeny={vm.handlePreSaveDeny}
      />

      {/* AI 분석 후 고객사 확인 (고객사 미설정 상태에서 AI가 추출한 경우) */}
      <PostAnalyzeClientModal
        open={!!vm.postAnalyzeClientState}
        ai_client_name={vm.postAnalyzeClientState?.ai_client_name ?? ""}
        matched_name={vm.postAnalyzeClientState?.matched_name}
        onConfirm={vm.handlePostAnalyzeConfirm}
        onDeny={vm.handlePostAnalyzeDeny}
      />

      {/* contents */}
      <PageScaffold
        kicker="NEW LOG"
        title="영업일지 작성"
        description="내용을 기록하면 AI가 일정/요약을 도와줘요"
        status="ready"
        notice={<SaleRegistAnalysisBanner state={vm.bannerState} message={vm.bannerMessage} onDismiss={vm.canDismissBanner ? vm.dismissBanner : undefined} />}
        onBack={vm.goList}
        primaryAction={{ label: "AI 저장", onClick: () => vm.submit(true), variant: "primary", disabled: vm.isBusy }}
        actions={[{ label: "저장", onClick: () => vm.submit(false), variant: "secondary", disabled: vm.isBusy }]}
      >
        <SaleRegistContent vm={vm} />
      </PageScaffold>
    </>
  );
}

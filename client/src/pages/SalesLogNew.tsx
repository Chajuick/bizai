import PageShell from "@/components/focuswin/common/page-shell"; // 없으면 div wrapper 그대로 써도 됨
import SalesLogNewHeader from "@/components/focuswin/sales-log/new/sales-log-new-header";
import SalesLogNewBanner from "@/components/focuswin/sales-log/new/sales-log-new-banner";
import SalesLogNewVoiceCard from "@/components/focuswin/sales-log/new/sales-log-new-voice-card";
import SalesLogNewBasicCard from "@/components/focuswin/sales-log/new/sales-log-new-basic-card";
import SalesLogNewContentCard from "@/components/focuswin/sales-log/new/sales-log-new-content-card";
import SalesLogNewBottomActions from "@/components/focuswin/sales-log/new/sales-log-new-bottom-actions";
import PreSaveClientModal from "@/components/focuswin/sales-log/new/presave-client-modal";
import ClientMatchModal from "@/components/focuswin/sales-log/new/client-match-modal";

import { useSalesLogNewViewModel } from "@/hooks/focuswin/sales-log/useSalesLogNewViewModel";

export default function SalesLogNew() {
  const vm = useSalesLogNewViewModel();

  return (
    <PageShell>
      {/* Modals */}
      {vm.preSaveState && (
        <PreSaveClientModal
          typedName={vm.preSaveState.typedName}
          matchedName={vm.preSaveState.matchedName}
          onConfirm={vm.handlePreSaveConfirm}
          onDeny={vm.handlePreSaveDeny}
        />
      )}

      {vm.matchSuggestion && (
        <ClientMatchModal
          suggestion={vm.matchSuggestion}
          onConfirm={vm.handleMatchConfirm}
          onDeny={vm.handleMatchDeny}
          isDenying={vm.isDenyingMatch}
        />
      )}

      {/* Sticky header */}
      <SalesLogNewHeader
        onBack={vm.goList}
        onSave={() => vm.submit(false)}
        onSaveAI={() => vm.submit(true)}
        isBusy={vm.isBusy}
        isSaving={vm.isSaving}
        isCheckingClient={vm.isCheckingClient}
        isAnalyzing={vm.isAnalyzing}
      />

      {/* Banner */}
      <SalesLogNewBanner
        state={vm.bannerState}
        message={vm.bannerMessage}
        onDismiss={vm.canDismissBanner ? vm.dismissBanner : undefined}
      />

      <form onSubmit={(e) => { e.preventDefault(); vm.submit(false); }} className="space-y-4">
        <SalesLogNewVoiceCard
          onTranscribed={vm.handleTranscribed}
          onAudioUrl={vm.setAudioUrl}
        />

        <SalesLogNewBasicCard
          form={vm.form}
          setForm={vm.setForm}
        />

        <SalesLogNewContentCard
          rawContent={vm.form.rawContent}
          onChangeRaw={(v) => vm.setForm(f => ({ ...f, rawContent: v }))}
        />

        <SalesLogNewBottomActions
          isBusy={vm.isBusy}
          isSaving={vm.isSaving}
          isCheckingClient={vm.isCheckingClient}
          isAnalyzing={vm.isAnalyzing}
          onSave={() => vm.submit(false)}
          onSaveAI={() => vm.submit(true)}
        />
      </form>
    </PageShell>
  );
}
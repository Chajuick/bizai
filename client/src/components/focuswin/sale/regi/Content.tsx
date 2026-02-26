import { useSaleRegiViewModel } from "@/hooks/focuswin/sale/useSaleRegiViewModel";
import SalesLogNewVoiceCard from "./sales-log-new-voice-card";
import SalesLogNewBasicCard from "./sales-log-new-basic-card";
import SaleRegiContentCard from "./SaleRegiContentCard";
import SalesLogNewBottomActions from "./sales-log-new-bottom-actions";

type Props = {
  vm: ReturnType<typeof useSaleRegiViewModel>;
};

export default function SaleRegiContent({ vm }: Props) {
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        vm.submit(false);
      }}
      className="space-y-4"
    >
      <SalesLogNewVoiceCard onTranscribed={vm.handleTranscribed} onAudioUrl={vm.setAudioUrl} />

      <SalesLogNewBasicCard form={vm.form} setForm={vm.setForm} />

      <SaleRegiContentCard rawContent={vm.form.rawContent} onChangeRaw={v => vm.setForm(f => ({ ...f, rawContent: v }))} />

      <SalesLogNewBottomActions
        isBusy={vm.isBusy}
        isSaving={vm.isSaving}
        isCheckingClient={vm.isCheckingClient}
        isAnalyzing={vm.isAnalyzing}
        onSave={() => vm.submit(false)}
        onSaveAI={() => vm.submit(true)}
      />
    </form>
  );
}

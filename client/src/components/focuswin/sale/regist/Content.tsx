import { useSaleRegistViewModel } from "@/hooks/focuswin/sale/useSaleRegistViewModel";
import SaleRegistVoiceCard from "./SaleRegistVoiceCard";
import SaleRegistBasicInfoCard from "./BasicInfoCard";
import SaleRegistContentCard from "./SaleRegistContentCard";

type Props = {
  vm: ReturnType<typeof useSaleRegistViewModel>;
};

export default function SaleRegistContent({ vm }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        vm.submit(false);
      }}
      className="space-y-4"
    >
      <SaleRegistVoiceCard
        onTranscribed={vm.handleTranscribed}
        onUploadedFileId={vm.setAudioFileIdno}
      />

      <SaleRegistBasicInfoCard form={vm.form} setForm={vm.setForm} />

      <SaleRegistContentCard
        rawContent={vm.form.orig_memo}
        onChangeRaw={(v) => vm.setForm((f) => ({ ...f, orig_memo: v }))}
      />
    </form>
  );
}
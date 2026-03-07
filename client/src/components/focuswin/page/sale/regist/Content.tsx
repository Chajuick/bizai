import { useSaleRegistVM } from "@/hooks/focuswin/sale/useSaleRegistVM";
import SaleRegistVoiceCard from "./SaleRegistVoiceCard";
import SaleRegistBasicInfoCard from "./BasicInfoCard";
import SaleRegistContentCard from "./SaleRegistContentCard";

type Props = {
  vm: ReturnType<typeof useSaleRegistVM>;
};

export default function SaleRegistContent({ vm }: Props) {
  return (
    <div
      className="space-y-4"
    >
      <SaleRegistVoiceCard
        onTranscribed={vm.handleTranscribed}
        onUploadedFileId={vm.setAudioFileIdno}
      />

      <SaleRegistBasicInfoCard form={vm.form} setForm={vm.setForm} />

      <SaleRegistContentCard
        rawContent={vm.form.orig_memo}
        onChangeRaw={vm.handleMemoChange}
      />
    </div>
  );
}
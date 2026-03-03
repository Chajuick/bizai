import { useSaleDetailVM } from "@/hooks/focuswin/sale/useSaleDetailVM";

import StatusBanner from "../../common/status-banner";
import SaleDetailEditFormCard from "./EditFormCard";
import SaleDetailMetaCard from "./MetaCard";
import SaleDetailAISummaryCard from "./AISummaryCard";
import SaleDetailRawCard from "./RawCard";
import SaleDetailTranscriptCard from "./TranscriptCard";

// #region Types

type Props = {
  vm: ReturnType<typeof useSaleDetailVM>;
};

// #endregion

// #region Component

export default function SaleDetailContent({ vm }: Props) {
  // #region Guards

  // status="ready"에서만 호출되긴 하지만, Content 단독 재사용 시 안전망
  if (!vm.log) return null;

  // #endregion

  // #region Render

  return (
    <>
      <Section>
        <StatusBanner state={vm.bannerState} message={vm.bannerMessage} onDismiss={vm.bannerState === "success" || vm.bannerState === "error" ? vm.resetAnalyze : undefined} />
      </Section>

      {vm.isEditing ? (
        <Section>
          <SaleDetailEditFormCard form={vm.editForm} setForm={vm.setEditForm} />
        </Section>
      ) : (
        <>
          <Section>
            <SaleDetailMetaCard
              clientName={vm.log.sale.clie_name}
              contactPerson={vm.log.sale.cont_name ?? vm.log.client_contact?.cont_name}
              clientPhone={vm.log.sale.cont_tele ?? vm.log.client_contact?.cont_tele}
              clientEmail={vm.log.sale.cont_mail ?? vm.log.client_contact?.cont_mail}
              location={vm.log.sale.sale_loca}
              salePric={vm.log.sale.sale_pric}
              visitedLabel={vm.visitedLabel}
            />
          </Section>

          {vm.log.sale.aiex_summ ? (
            <Section>
              <SaleDetailAISummaryCard
                aiSummary={vm.ai.summary}
                aiActions={vm.aiActions}
                pricing={vm.ai.pricing}
              />
            </Section>
          ) : null}

          <Section>
            <SaleDetailRawCard rawContent={vm.log.sale.orig_memo} />
          </Section>

          {vm.log.sale.sttx_text && vm.log.sale.sttx_text !== vm.log.sale.orig_memo ? (
            <Section>
              <SaleDetailTranscriptCard transcribedText={vm.log.sale.sttx_text} />
            </Section>
          ) : null}
        </>
      )}
    </>
  );

  // #endregion
}

// #endregion

// #region Helpers

function Section({ children }: { children: React.ReactNode }) {
  return <div className="mt-4">{children}</div>;
}

// #endregion

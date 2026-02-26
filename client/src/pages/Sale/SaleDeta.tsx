import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";

import PageShell from "@/components/focuswin/common/page-shell";
import StatusBanner from "@/components/focuswin/sale/deta/status-banner";
import ConfirmActionDialog, { ConfirmState } from "@/components/focuswin/common/confirm-action-dialog";

import { useSalesLogDetailViewModel } from "@/hooks/focuswin/sale/useSalesLogDetailViewModel";

import SalesLogDetailHeader from "@/components/focuswin/sale/deta/sales-log-detail-header";
import SalesLogDetailLoading from "@/components/focuswin/sale/deta/sales-log-detail-loading";
import SalesLogDetailNotFound from "@/components/focuswin/sale/deta/sales-log-detail-not-found";
import SalesLogEditFormCard from "@/components/focuswin/sale/deta/sales-log-edit-form-card";
import SalesLogMetaCard from "@/components/focuswin/sale/deta/sales-log-meta-card";
import SalesLogAISummaryCard from "@/components/focuswin/sale/deta/sales-log-ai-summary-card";
import SalesLogRawCard from "@/components/focuswin/sale/deta/sales-log-raw-card";
import SalesLogTranscriptCard from "@/components/focuswin/sale/deta/sales-log-transcript-card";

export default function SaleDeta() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const logId = Number(id);

  const vm = useSalesLogDetailViewModel(logId);

  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const title = useMemo(() => vm.log?.clientName || "영업일지", [vm.log?.clientName]);

  const visitedLabel = useMemo(() => {
    if (!vm.log?.visitedAt) return "";
    return new Date(vm.log.visitedAt).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [vm.log?.visitedAt]);

  const goKeywordSearch = (kw: string) => {
    const q = encodeURIComponent(kw);
    navigate(`/sale-list?search=${q}`);
  };

  if (vm.isLoading) {
    return (
      <PageShell>
        <SalesLogDetailLoading />
      </PageShell>
    );
  }

  if (!vm.log) {
    return (
      <PageShell>
        <SalesLogDetailNotFound
          onGoList={() => navigate("/sale-list")}
          onCreateNew={() => navigate("/sale-list/regi")}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SalesLogDetailHeader
        title={title}
        visitedLabel={visitedLabel}
        isProcessed={!!vm.log.isProcessed}
        isEditing={vm.isEditing}
        onBack={() => navigate("/sale-list")}
        onAnalyze={vm.runAnalyze}
        onEdit={vm.startEdit}
        onDeleteRequest={() =>
          setConfirm({ type: "delete", id: vm.log!.id, title: title })
        }
        onSave={vm.save}
        onCancelEdit={vm.cancelEdit}
        analyzePending={vm.analyze.isPending}
        updatePending={vm.update.isPending}
        deletePending={vm.del.isPending}
      />

      <div className="mt-4">
        <StatusBanner
          state={vm.bannerState}
          message={vm.bannerMessage}
          onDismiss={
            vm.bannerState === "success" || vm.bannerState === "error"
              ? vm.resetAnalyze
              : undefined
          }
        />
      </div>

      {vm.isEditing ? (
        <div className="mt-4">
          <SalesLogEditFormCard form={vm.editForm} setForm={vm.setEditForm} />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <SalesLogMetaCard
              clientName={vm.log.clientName}
              contactPerson={vm.log.contactPerson}
              location={vm.log.location}
              visitedLabel={visitedLabel}
            />
          </div>

          {vm.log.aiSummary && (
            <div className="mt-4">
              <SalesLogAISummaryCard
                aiSummary={vm.log.aiSummary}
                aiExtracted={vm.log.aiExtracted}
                onKeywordClick={goKeywordSearch}
              />
            </div>
          )}

          <div className="mt-4">
            <SalesLogRawCard rawContent={vm.log.rawContent} />
          </div>

          {vm.log.transcribedText && vm.log.transcribedText !== vm.log.rawContent && (
            <div className="mt-4">
              <SalesLogTranscriptCard transcribedText={vm.log.transcribedText} />
            </div>
          )}
        </>
      )}

      <ConfirmActionDialog
        confirm={confirm}
        setConfirm={setConfirm}
        onConfirm={async c => {
          if (c.type !== "delete") return;
          await vm.remove();
          navigate("/sale-list");
        }}
      />
    </PageShell>
  );
}
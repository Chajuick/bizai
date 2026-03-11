import { Plus, Upload } from "lucide-react";

import { useClientListVM } from "@/hooks/focuswin/client/useClientListVM";
import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";
import ClientListHeadContent from "@/components/focuswin/page/client/list/HeadContent";
import ClientListEmptyCard from "@/components/focuswin/page/client/list/EmptyCard";
import ClientListContent from "@/components/focuswin/page/client/list/Content";
import ClientUploadGuideModal from "@/components/focuswin/page/client/list/UploadGuideModal";
import ClientUploadResultModal from "@/components/focuswin/page/client/list/UploadResultModal";
import ProcessingOverlay from "@/components/focuswin/common/overlays/processing-overlay";

export default function ClientListPage() {
  const vm = useClientListVM();

  return (
    <>
      {/* 업로드 처리 중 오버레이 */}
      <ProcessingOverlay visible={vm.isUploading} message="거래처를 업로드하고 있습니다..." />

      {/* 업로드 가이드 모달 */}
      <ClientUploadGuideModal
        open={vm.showUploadGuide}
        onClose={vm.closeUploadGuide}
        onDownloadTemplate={vm.downloadTemplate}
        onSelectFile={vm.openUploadPicker}
      />

      {/* 업로드 결과 모달 */}
      <ClientUploadResultModal result={vm.uploadResult} onClose={vm.clearUploadResult} />

      {/* 숨겨진 파일 input */}
      <input
        ref={vm.fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) vm.handleUploadFile(file);
        }}
      />

      <PageScaffold
        kicker="CLIENTS"
        title="거래처"
        description="거래처/담당자 정보를 빠르게 찾고 관리해요."
        primaryAction={{ label: "거래처 추가", icon: <Plus size={16} />, onClick: vm.goRegist }}
        actions={[
          {
            label: "엑셀 업로드",
            icon: <Upload size={16} />,
            onClick: vm.openUploadGuide,
            variant: "outline" as const,
            disabled: vm.isUploading,
          },
        ]}
        status={vm.status}
        headerChildren={<ClientListHeadContent vm={vm} />}
        empty={<ClientListEmptyCard vm={vm} />}
        fab={{ label: "거래처 추가", onClick: vm.goRegist, icon: <Plus size={24} /> }}
      >
        <ClientListContent vm={vm} />
      </PageScaffold>
    </>
  );
}

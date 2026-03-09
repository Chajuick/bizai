import { AlertTriangle, Download, FileSpreadsheet, Upload } from "lucide-react";
import Modal from "@/components/focuswin/common/ui/modal";
import { Button } from "@/components/focuswin/common/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onSelectFile: () => void;
};

export default function ClientUploadGuideModal({
  open,
  onClose,
  onDownloadTemplate,
  onSelectFile,
}: Props) {
  return (
    <Modal open={open} onOpenChange={(o) => { if (!o) onClose(); }} maxWidthClassName="max-w-md">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
          <FileSpreadsheet size={18} className="text-blue-600" />
        </div>
        <div>
          <p className="text-base font-black text-slate-900">엑셀로 고객사 일괄 등록</p>
          <p className="text-xs text-slate-500 mt-0.5">
            많은 거래처를 엑셀로 편하게 업로드할 수 있어요.
          </p>
        </div>
      </div>

      {/* 단계 안내 */}
      <div className="flex flex-col gap-3 mb-5">
        <Step
          number={1}
          title="양식 다운로드"
          desc="아래 [양식 다운로드] 버튼으로 양식을 받아 고객사 정보를 입력하세요."
        />
        <Step
          number={2}
          title="파일 업로드"
          desc="작성한 파일을 [파일 선택] 버튼으로 업로드하면 자동으로 등록돼요."
        />
      </div>

      {/* 주의사항 */}
      <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
          <span className="text-xs font-black text-amber-700">주의사항</span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {[
            "고객사명 + 사업자번호(10자리)가 있는 행만 등록돼요.",
            "같은 사업자번호가 있으면 정보가 업데이트돼요. (중복 등록 없음)",
            "업로드 중 브라우저를 닫으면 결과를 확인하지 못할 수 있어요.",
            "지원 형식: .xlsx  .xls  .csv",
          ].map((text) => (
            <li key={text} className="flex items-start gap-2 text-xs text-amber-800">
              <span className="mt-[3px] shrink-0 w-1 h-1 rounded-full bg-amber-400" />
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="rounded-2xl gap-1.5"
          onClick={onDownloadTemplate}
        >
          <Download size={14} />
          양식 다운로드
        </Button>
        <Button
          tone="primary"
          variant="solid"
          size="sm"
          className="rounded-2xl gap-1.5"
          onClick={onSelectFile}
        >
          <Upload size={14} />
          파일 선택
        </Button>
      </div>
    </Modal>
  );
}

function Step({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

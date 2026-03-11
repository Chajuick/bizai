import React from "react";
import { Sparkles, FileText, Building2, CalendarClock } from "lucide-react";

import FormDialog from "@/components/focuswin/common/overlays/form-dialog";
import Chip from "@/components/focuswin/common/ui/chip";

import type { OrderQuickFormState } from "@/types/order";
import type { EnhancedSchedule } from "@/types/schedule";

import {
  TextField,
  TextAreaField,
  SelectField,
  MoneyField,
  DateField,
} from "@/components/focuswin/common/form";

export type { OrderQuickFormState };

// #region UI Helpers
function PreviewCard({
  title,
  desc,
  chips,
  items,
}: {
  title: React.ReactNode;
  desc?: React.ReactNode;
  chips?: React.ReactNode;
  items?: React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-3xl border border-slate-200/70 bg-white
        px-4 py-3
        shadow-[0_10px_28px_rgba(15,23,42,0.06)]
      "
    >
      <div className="space-y-2">
        {/* 🔹 제목 + 칩 한 줄 */}
        <div className="flex items-start gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-slate-900 truncate">{title}</div>
          </div>

          {chips ? <div className="flex items-center gap-1.5 shrink-0">{chips}</div> : null}
        </div>

        {/* 🔹 설명 */}
        {desc ? <div className="text-xs text-slate-600 line-clamp-2">{desc}</div> : null}

        {/* 🔹 거래처 등 아이템 */}
        {items ? <div className="space-y-1">{items}</div> : null}
      </div>
    </div>
  );
}
// #endregion

export default function CreateOrderModal({
  open,
  onOpenChange,
  selectedPromise,
  orderForm,
  setOrderForm,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPromise: EnhancedSchedule | null;
  orderForm: OrderQuickFormState;
  setOrderForm: React.Dispatch<React.SetStateAction<OrderQuickFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}) {
  // #region Derived
  const scheName = selectedPromise?.sche_name ?? "";
  const scheDesc = selectedPromise?.sche_desc ?? "";
  const clieName = selectedPromise?.clie_name ?? "";
  const isAi = !!selectedPromise?.auto_gene;

  const scheDateLabel = selectedPromise?.sche_date
    ? new Date(selectedPromise.sche_date as any).toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  // #endregion

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="수주 생성"
      subtitle={
        selectedPromise ? (
          <div className="space-y-2">
            <PreviewCard
              title={
                <span className="flex items-center gap-2 min-w-0">
                  <FileText size={14} className="text-slate-400" />
                  <span className="truncate">{scheName}</span>
                </span>
              }
              desc={scheDesc || (scheDateLabel ? `일시: ${scheDateLabel}` : undefined)}
              chips={
                <>
                  {isAi ? (
                    <Chip tone="violet" icon={Sparkles} label="AI 생성" />
                  ) : (
                    <Chip tone="slate" icon={Sparkles} label="수동" />
                  )}
                  {scheDateLabel ? <Chip tone="blue" icon={CalendarClock} label={scheDateLabel} /> : null}
                </>
              }
            />

            {clieName ? (
              <div className="flex items-center gap-2 rounded-3xl border border-slate-200/70 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                <span className="inline-flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" />
                </span>
                <span className="font-black text-slate-900 truncate text-sm">{clieName}</span>
              </div>
            ) : null}
          </div>
        ) : null
      }
      actionLabel="수주 생성"
      actionTone="primary"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    >
      <div className="space-y-4">
        {/* 상품/서비스 */}
        <TextField
          label="상품/서비스"
          required
          value={orderForm.prod_serv}
          onChange={(v) => setOrderForm((f) => ({ ...f, prod_serv: v }))}
          inputProps={{
            required: true,
            placeholder: "예: 소프트웨어 개발",
            maxLength: 200,
          }}
        />

        {/* 예상 금액 */}
        <MoneyField
          label="예상 금액 (원)"
          value={orderForm.orde_pric ?? ""}
          onChange={(v) =>
            setOrderForm((f) => ({
              ...f,
              // MoneyField는 "1,000,000" 같은 포맷이 올 수 있으니 저장은 콤마 제거한 string으로 통일
              orde_pric: v ? v.replace(/,/g, "") : "",
            }))
          }
          inputProps={{
            placeholder: "5000000",
            maxLength: 13,
            required: true,
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          {/* 초기 상태 */}
          <SelectField
            label="초기 상태"
            value={orderForm.stat_code}
            onChange={(v) =>
              setOrderForm((f) => ({
                ...f,
                stat_code: v as OrderQuickFormState["stat_code"],
              }))
            }
            options={[
              { value: "proposal", label: "제안" },
              { value: "negotiation", label: "협상" },
              { value: "confirmed", label: "확정" },
            ]}
            triggerClassName="border-slate-200 px-3 w-full"
          />

          {/* 계약일 */}
          <DateField
            label="계약일"
            value={orderForm.ctrt_date}
            onChange={(v) => setOrderForm((f) => ({ ...f, ctrt_date: v }))}
          />
        </div>

        {/* 메모 */}
        <TextAreaField
          label="메모"
          value={orderForm.orde_memo}
          onChange={(v) => setOrderForm((f) => ({ ...f, orde_memo: v }))}
          textareaProps={{
            rows: 2,
            placeholder: "일정 메모에서 자동 입력",
          }}
        />
      </div>
    </FormDialog>
  );
}
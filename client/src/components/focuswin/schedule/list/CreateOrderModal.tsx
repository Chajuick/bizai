import React from "react";
import { Sparkles, FileText, Building2, CalendarClock } from "lucide-react";

import { Input } from "@/components/focuswin/common/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/focuswin/common/ui/textarea";
import FormDialog from "@/components/focuswin/common/form-dialog";

import type { OrderQuickFormState } from "@/types/order";
import type { EnhancedSchedule } from "@/types/schedule";
import Chip from "../../common/ui/chip";

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
            <div className="text-sm font-black text-slate-900 truncate">
              {title}
            </div>
          </div>

          {chips ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {chips}
            </div>
          ) : null}
        </div>

        {/* 🔹 설명 */}
        {desc ? (
          <div className="text-xs text-slate-600 line-clamp-2">
            {desc}
          </div>
        ) : null}

        {/* 🔹 고객사 등 아이템 */}
        {items ? (
          <div className="space-y-1">
            {items}
          </div>
        ) : null}
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

  // 일정 일시도 같이 보여주고 싶으면 아래를 켜면 됨(없으면 제거)
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
            {/* Toss-style: 위에 미리보기 카드 */}
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
                  {scheDateLabel ? (
                    <Chip tone="blue" icon={CalendarClock} label={scheDateLabel} />
                  ) : null}
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
      {/* #region Form Fields */}
      <div>
        <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">상품/서비스 *</Label>
        <Input
          value={orderForm.prod_serv}
          onChange={(e) => setOrderForm((f) => ({ ...f, prod_serv: e.target.value }))}
          required
          placeholder="예: 소프트웨어 개발"
          className="rounded-2xl border-slate-200"
        />
      </div>

      <div>
        <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">예상 금액 (원) *</Label>
        <Input
          type="number"
          value={orderForm.orde_pric}
          onChange={(e) => setOrderForm((f) => ({ ...f, orde_pric: e.target.value }))}
          required
          placeholder="5000000"
          className="rounded-2xl border-slate-200"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">초기 상태</Label>
          <select
            value={orderForm.stat_code}
            onChange={(e) =>
              setOrderForm((f) => ({
                ...f,
                stat_code: e.target.value as OrderQuickFormState["stat_code"],
              }))
            }
            className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
          >
            <option value="proposal">제안</option>
            <option value="negotiation">협상</option>
            <option value="confirmed">확정</option>
          </select>
        </div>

        <div>
          <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">계약일</Label>
          <Input
            type="date"
            value={orderForm.ctrt_date}
            onChange={(e) => setOrderForm((f) => ({ ...f, ctrt_date: e.target.value }))}
            className="rounded-2xl border-slate-200"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">메모</Label>
        <Textarea
          value={orderForm.orde_memo}
          onChange={(e) => setOrderForm((f) => ({ ...f, orde_memo: e.target.value }))}
          rows={2}
          className="rounded-2xl border-slate-200 resize-none"
          placeholder="일정 메모에서 자동 입력"
        />
      </div>
      {/* #endregion */}
    </FormDialog>
  );
}
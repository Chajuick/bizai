// src/components/focuswin/client/common/ContactEditor.tsx

// #region Imports
import * as React from "react";
import type { ContactDraft } from "@/types/";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Star, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/focuswin/common/ui/button";
import { Card } from "@/components/focuswin/common/ui/card";
import { Input } from "@/components/focuswin/common/ui/input";
import { Textarea } from "@/components/focuswin/common/ui/textarea";
// #endregion

// #region Types
type Props = {
  disabled?: boolean;
  contacts: ContactDraft[];
  onAdd: () => void;
  onChange: (index: number, patch: Partial<ContactDraft>) => void;
  onRemove: (index: number) => void;
};
// #endregion

// #region Helpers
function getInitial(name: string) {
  const t = (name ?? "").trim();
  return t ? t[0].toUpperCase() : "?";
}
function safeText(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function joinSummary(role: string, tele: string, mail: string) {
  return [role, tele || mail].filter(Boolean).join(" · ");
}
// #endregion

export default function ContactEditor({ disabled, contacts, onAdd, onChange, onRemove }: Props) {
  // #region Derived
  const visible = React.useMemo(() => contacts.filter(c => c._state !== "delete"), [contacts]);
  const visibleCount = visible.length;

  /** 조작 가능 여부(버튼, 폼) */
  const canEdit = !disabled;
  // #endregion

  // #region UI State
  const [open, setOpen] = React.useState<Record<number, boolean>>({});
  const isOpen = React.useCallback((idx: number) => open[idx] ?? true, [open]);
  const toggleOpen = React.useCallback((idx: number) => setOpen(p => ({ ...p, [idx]: !(p[idx] ?? true) })), []);
  // #endregion

  // #region Actions
  const setMain = React.useCallback(
    (fullIdx: number) => {
      contacts.forEach((c, i) => {
        if (c._state === "delete") return;
        const shouldBeMain = i === fullIdx;
        if (!!c.main_yesn !== shouldBeMain) onChange(i, { main_yesn: shouldBeMain });
      });
    },
    [contacts, onChange]
  );
  // #endregion

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 mb-3" style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}>
      {/* #region Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col items-start">
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">CONTACT</p>
          <div className="mt-1 flex items-center gap-2" >
            <p className="text-sm font-black text-slate-900">담당자</p>
            <span className={cn("text-[11px] font-bold rounded-full px-2 py-0.5", visibleCount > 0 ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-400")}>{visibleCount}</span>
          </div>
        </div>

        {/* ✅ 편집모드일 때만 '추가' 노출 */}
        {canEdit && (
          <Button type="button" variant="ghost" onClick={onAdd} className={cn("h-9 rounded-2xl px-3 text-xs font-semibold", "text-sky-600 hover:bg-slate-100", "active:scale-[0.98] transition")}>
            <Plus size={14} className="mr-1" />
            추가
          </Button>
        )}
      </div>
      {/* #endregion */}

      {/* #region Empty */}
      {visibleCount === 0 ? (
        <Card className="p-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50/40">
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold text-slate-500">등록된 담당자가 없습니다</p>
            <p className="text-[11px] text-slate-400">{canEdit ? "오른쪽 상단 ‘추가’로 담당자를 등록해보세요." : "편집 모드에서 담당자를 추가할 수 있어요."}</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map((c, fullIdx) => {
            if (c._state === "delete") return null;

            const name = safeText(c.cont_name).trim();
            const role = safeText(c.cont_role).trim();
            const tele = safeText(c.cont_tele).trim();
            const mail = safeText(c.cont_mail).trim();
            const memo = safeText(c.cont_memo);

            const title = name || "이름 미입력";
            const sub = joinSummary(role, tele, mail);

            return (
              <Card
                key={`${c.cont_idno ?? "new"}-${fullIdx}`}
                className={cn("rounded-3xl bg-white", "border border-slate-200/60", "px-4 py-3", "shadow-[0_1px_0_rgba(0,0,0,0.06)]", "transition", canEdit && "hover:bg-slate-50/40")}
              >
                {/* #region Summary Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Avatar */}
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", "bg-slate-50 border border-slate-100", "text-slate-800")}>
                      <span className="text-sm font-black">{getInitial(name)}</span>
                    </div>

                    {/* Title / Sub */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-extrabold text-slate-900 truncate">{title}</p>

                        {/* ✅ 대표는 "정보"이므로 읽기모드에도 표시 */}
                        {c.main_yesn && (
                          <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 bg-amber-50 border border-amber-100">
                            <Star size={11} className="text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-bold text-amber-700">대표</span>
                          </span>
                        )}

                        {/* ✅ draft 뱃지는 편집시에만 */}
                        {canEdit && c._state !== "keep" && (
                          <span
                            className={cn(
                              "text-[10px] font-bold rounded-full px-2 py-0.5 border",
                              c._state === "new" && "bg-emerald-50 text-emerald-700 border-emerald-100",
                              c._state === "update" && "bg-indigo-50 text-indigo-700 border-indigo-100"
                            )}
                          >
                            {c._state === "new" ? "NEW" : "EDIT"}
                          </span>
                        )}
                      </div>

                      {sub ? (
                        <p className="mt-0.5 text-[12px] text-slate-500 truncate">{sub}</p>
                      ) : (
                        <p className="mt-0.5 text-[12px] text-slate-400 truncate">{canEdit ? "업무/연락처를 입력해 주세요" : "업무/연락처 정보가 없습니다"}</p>
                      )}
                    </div>
                  </div>

                  {/* ✅ 조작 버튼은 편집모드에서만 노출 */}
                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* 펼치기/접기 */}
                      <button
                        type="button"
                        onClick={() => toggleOpen(fullIdx)}
                        className={cn("h-9 w-9 rounded-2xl grid place-items-center", "text-slate-500 hover:text-slate-800", "hover:bg-slate-100", "active:scale-[0.98] transition")}
                        aria-label={isOpen(fullIdx) ? "담당자 입력 폼 접기" : "담당자 입력 폼 펼치기"}
                      >
                        {isOpen(fullIdx) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {/* 대표로 지정(조작) */}
                      <button
                        type="button"
                        onClick={() => setMain(fullIdx)}
                        className={cn(
                          "h-9 px-3 rounded-2xl text-xs font-semibold inline-flex items-center gap-1.5",
                          "border transition active:scale-[0.98]",
                          c.main_yesn ? "bg-amber-50 border-amber-100 text-amber-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <Star size={14} className={cn(c.main_yesn ? "text-amber-600 fill-amber-600" : "text-slate-400")} />
                        {c.main_yesn ? "대표" : "대표로"}
                      </button>

                      {/* 삭제 */}
                      <button
                        type="button"
                        onClick={() => onRemove(fullIdx)}
                        className={cn(
                          "h-9 w-9 rounded-2xl grid place-items-center",
                          "text-slate-400 hover:text-red-600",
                          "hover:bg-red-50/60",
                          "border border-transparent hover:border-red-100",
                          "active:scale-[0.98] transition"
                        )}
                        aria-label="담당자 삭제"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                {/* #endregion */}

                {/* #region Form Fields */}
                {/* ✅ 편집모드에서만 폼 노출 */}
                {canEdit && isOpen(fullIdx) && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600">이름</label>
                      <Input value={name} onChange={e => onChange(fullIdx, { cont_name: e.target.value })} placeholder="예: 김민수" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600">업무</label>
                      <Input value={role} onChange={e => onChange(fullIdx, { cont_role: e.target.value })} placeholder="예: 구매팀 매니저" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600">전화</label>
                      <Input value={tele} onChange={e => onChange(fullIdx, { cont_tele: e.target.value })} placeholder="예: 010-1234-5678" inputMode="tel" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600">이메일</label>
                      <Input value={mail} onChange={e => onChange(fullIdx, { cont_mail: e.target.value })} placeholder="예: minsukim@company.com" inputMode="email" />
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600">메모</label>
                      <Textarea value={memo} onChange={e => onChange(fullIdx, { cont_memo: e.target.value })} placeholder="예: 회신은 이메일 선호 / 오전 연락 가능" rows={3} className="min-h-24" />
                    </div>
                  </div>
                )}
                {/* #endregion */}
              </Card>
            );
          })}
        </div>
      )}
      {/* #endregion */}
    </div>
  );
}

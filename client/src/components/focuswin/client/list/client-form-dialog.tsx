// client/src/components/focuswin/clients/client-form-dialog.tsx

import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/focuswin/common/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/focuswin/common/ui/textarea";
import { Button } from "@/components/focuswin/common/ui/button";
import type { ClientFormState } from "@/types/client";

export default function ClientFormDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  form: ClientFormState;
  setForm: React.Dispatch<React.SetStateAction<ClientFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-slate-100 bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-black">고객사 등록</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">고객사명 *</Label>
            <Input
              value={form.clie_name}
              onChange={(e) => setForm((f) => ({ ...f, clie_name: e.target.value }))}
              required
              placeholder="(주)삼성전자"
              className="rounded-2xl border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">업종</Label>
              <Input
                value={form.indu_type}
                onChange={(e) => setForm((f) => ({ ...f, indu_type: e.target.value }))}
                placeholder="제조업"
                className="rounded-2xl border-slate-200"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">담당자</Label>
              <Input
                value={form.cont_name}
                onChange={(e) => setForm((f) => ({ ...f, cont_name: e.target.value }))}
                placeholder="홍길동 부장"
                className="rounded-2xl border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">연락처</Label>
              <Input
                value={form.cont_tele}
                onChange={(e) => setForm((f) => ({ ...f, cont_tele: e.target.value }))}
                placeholder="010-1234-5678"
                className="rounded-2xl border-slate-200"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">이메일</Label>
              <Input
                value={form.cont_mail}
                onChange={(e) => setForm((f) => ({ ...f, cont_mail: e.target.value }))}
                placeholder="hong@samsung.com"
                className="rounded-2xl border-slate-200"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">주소</Label>
            <Input
              value={form.clie_addr}
              onChange={(e) => setForm((f) => ({ ...f, clie_addr: e.target.value }))}
              placeholder="서울 강남구 테헤란로 123"
              className="rounded-2xl border-slate-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">메모</Label>
            <Textarea
              value={form.clie_memo}
              onChange={(e) => setForm((f) => ({ ...f, clie_memo: e.target.value }))}
              rows={3}
              className="rounded-2xl border-slate-200 resize-none"
              placeholder="선택 입력"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl text-white font-bold"
            style={{
              background: "rgb(37, 99, 235)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
            }}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            등록
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
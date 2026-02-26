import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/focuswin/common/ui/button";
import { Input } from "@/components/focuswin/common/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/focuswin/common/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClientNameInput from "@/components/ClientNameInput";
import type { PromiseFormState } from "@/types/promise";

export type { PromiseFormState };

export default function PromiseFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: PromiseFormState;
  setForm: React.Dispatch<React.SetStateAction<PromiseFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-slate-100 bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-black">
            {editing ? "일정 수정" : "일정 추가"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              고객사 (선택)
            </Label>
            <ClientNameInput
              value={form.clientName}
              clientId={form.clientId}
              onChange={(name, id) => setForm((f) => ({ ...f, clientName: name, clientId: id }))}
              placeholder="(주)삼성전자"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              일정 내용 *
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="제안서 발표 미팅"
              required
              className="rounded-2xl border-slate-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              일시 *
            </Label>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              required
              className="rounded-2xl border-slate-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              메모 (선택)
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="일정 관련 메모"
              rows={3}
              className="rounded-2xl border-slate-200 resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={!!isSubmitting}
            className="w-full rounded-2xl text-white font-bold"
            style={{
              background: "rgb(37, 99, 235)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
            }}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {editing ? "수정" : "등록"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
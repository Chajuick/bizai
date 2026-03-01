import { useState } from "react";
import { Plus, Pencil, Trash2, Phone, Mail, Briefcase, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/focuswin/common/ui/button";
import { Input } from "@/components/focuswin/common/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/focuswin/common/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ContactFormState } from "@/hooks/focuswin/client/detail/useClientDetailViewModel";
import type { RouterOutputs } from "@/types/router";

type ContactRow = RouterOutputs["crm"]["client"]["contact"]["list"][number];

// #region ContactCard
function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: ContactRow;
  onEdit: (c: ContactRow) => void;
  onDelete: (cont_idno: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="relative rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-blue-600">
              {(contact.cont_name[0] ?? "?").toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-slate-900 truncate">{contact.cont_name}</p>
              {contact.main_yesn && (
                <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
              )}
            </div>
            {contact.cont_role && (
              <p className="text-xs text-slate-500 truncate">{contact.cont_role}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(contact)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {(contact.cont_tele || contact.cont_mail) && (
        <div className="mt-2.5 space-y-1 pl-10">
          {contact.cont_tele && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Phone size={11} className="text-slate-400" />
              <span>{contact.cont_tele}</span>
            </div>
          )}
          {contact.cont_mail && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Mail size={11} className="text-slate-400" />
              <span>{contact.cont_mail}</span>
            </div>
          )}
        </div>
      )}

      {contact.cont_memo && (
        <p className="mt-2 pl-10 text-xs text-slate-500 line-clamp-2">{contact.cont_memo}</p>
      )}

      {/* 삭제 확인 인라인 */}
      {confirmDelete && (
        <div className="absolute inset-0 rounded-2xl bg-white/95 flex flex-col items-center justify-center gap-2 p-4">
          <p className="text-xs font-semibold text-slate-700">담당자를 삭제할까요?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              onClick={() => { setConfirmDelete(false); onDelete(contact.cont_idno); }}
              className="px-3 py-1 text-xs font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
// #endregion

// #region ContactFormDialog
function ContactFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: boolean;
  form: ContactFormState;
  setForm: React.Dispatch<React.SetStateAction<ContactFormState>>;
  onSubmit: () => void;
  isSaving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-slate-100 bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-black">
            {editing ? "담당자 수정" : "담당자 등록"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">담당자명 *</Label>
              <Input
                value={form.cont_name}
                onChange={(e) => setForm((f) => ({ ...f, cont_name: e.target.value }))}
                placeholder="홍길동"
                className="rounded-2xl border-slate-200"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">직함/직책</Label>
              <Input
                value={form.cont_role}
                onChange={(e) => setForm((f) => ({ ...f, cont_role: e.target.value }))}
                placeholder="구매팀장"
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
                placeholder="hong@company.com"
                className="rounded-2xl border-slate-200"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">메모</Label>
            <Textarea
              value={form.cont_memo}
              onChange={(e) => setForm((f) => ({ ...f, cont_memo: e.target.value }))}
              rows={2}
              className="rounded-2xl border-slate-200 resize-none"
              placeholder="선택 입력"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.main_yesn}
              onChange={(e) => setForm((f) => ({ ...f, main_yesn: e.target.checked }))}
              className="rounded"
            />
            <span className="text-xs font-semibold text-slate-700">대표 담당자로 지정</span>
            <Star size={12} className="text-amber-400 fill-amber-400" />
          </label>

          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSaving || !form.cont_name.trim()}
            className="w-full rounded-2xl text-white font-bold"
            style={{
              background: "rgb(37, 99, 235)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
            }}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {editing ? "수정" : "등록"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// #endregion

// #region ClientContacts (main export)
export default function ClientContacts({
  contacts,
  loading,
  showContactForm,
  editingContactId,
  contactForm,
  setContactForm,
  isSavingContact,
  onOpenNew,
  onOpenEdit,
  onCloseForm,
  onSave,
  onDelete,
}: {
  contacts: ContactRow[];
  loading: boolean;
  showContactForm: boolean;
  editingContactId: number | null;
  contactForm: ContactFormState;
  setContactForm: React.Dispatch<React.SetStateAction<ContactFormState>>;
  isSavingContact: boolean;
  onOpenNew: () => void;
  onOpenEdit: (c: ContactRow) => void;
  onCloseForm: () => void;
  onSave: () => void;
  onDelete: (cont_idno: number) => void;
}) {
  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white p-4 mb-4"
      style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-slate-400" />
          <p className="text-xs font-extrabold tracking-[0.14em] text-slate-500 uppercase">Contacts</p>
          {contacts.length > 0 && (
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">
              {contacts.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenNew}
          className="h-7 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 px-2"
        >
          <Plus size={13} className="mr-1" />
          추가
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={18} className="animate-spin text-slate-300" />
        </div>
      ) : contacts.length === 0 ? (
        <p className="text-center text-xs text-slate-400 py-4">등록된 담당자가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <ContactCard
              key={c.cont_idno}
              contact={c}
              onEdit={onOpenEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <ContactFormDialog
        open={showContactForm}
        onOpenChange={(o) => { if (!o) onCloseForm(); }}
        editing={editingContactId !== null}
        form={contactForm}
        setForm={setContactForm}
        onSubmit={onSave}
        isSaving={isSavingContact}
      />
    </div>
  );
}
// #endregion

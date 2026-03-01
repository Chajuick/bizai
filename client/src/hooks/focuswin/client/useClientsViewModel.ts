// client/src/hooks/focuswin/clients/useClientsViewModel.ts

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { ClientFormState, ClientRow } from "@/types/client";

const EMPTY_FORM: ClientFormState = {
  clie_name: "",
  indu_type: "",
  cont_name: "",
  cont_tele: "",
  cont_mail: "",
  clie_addr: "",
  clie_memo: "",
};

export function useClientsViewModel() {
  const [search, setSearch] = useState("");

  // ── Create ────────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ClientFormState>({ ...EMPTY_FORM });

  // ── Edit ──────────────────────────────────────────────────────────────────
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ClientFormState>({ ...EMPTY_FORM });

  const { data: clientsData, isLoading } = trpc.crm.client.list.useQuery({
    search: search || undefined,
  });

  const createMutation = trpc.crm.client.create.useMutation();
  const updateMutation = trpc.crm.client.update.useMutation();
  const utils = trpc.useUtils();

  const clients = clientsData?.items ?? [];
  const filteredCount = useMemo(() => clients.length, [clients]);
  const hasData = filteredCount > 0;

  const resetForm = () => setForm({ ...EMPTY_FORM });

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const closeCreate = () => {
    setShowForm(false);
    resetForm();
  };

  const openEdit = (client: ClientRow) => {
    setEditingId(client.clie_idno);
    setEditForm({
      clie_name: client.clie_name ?? "",
      indu_type: client.indu_type ?? "",
      cont_name: client.cont_name ?? "",
      cont_tele: client.cont_tele ?? "",
      cont_mail: client.cont_mail ?? "",
      clie_addr: client.clie_addr ?? "",
      clie_memo: client.clie_memo ?? "",
    });
    setShowEditForm(true);
  };

  const closeEdit = () => {
    setShowEditForm(false);
    setEditingId(null);
    setEditForm({ ...EMPTY_FORM });
  };

  const invalidate = () => utils.crm.client.list.invalidate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clie_name.trim()) {
      toast.error("고객사명을 입력해주세요.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        clie_name: form.clie_name.trim(),
        indu_type: form.indu_type.trim() || undefined,
        cont_name: form.cont_name.trim() || undefined,
        cont_tele: form.cont_tele.trim() || undefined,
        cont_mail: form.cont_mail.trim() || undefined,
        clie_addr: form.clie_addr.trim() || undefined,
        clie_memo: form.clie_memo.trim() || undefined,
      });
      invalidate();
      toast.success("고객사가 등록되었습니다.");
      closeCreate();
    } catch {
      toast.error("등록에 실패했습니다.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editForm.clie_name.trim()) {
      toast.error("고객사명을 입력해주세요.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        clie_idno: editingId,
        clie_name: editForm.clie_name.trim(),
        indu_type: editForm.indu_type.trim() || undefined,
        cont_name: editForm.cont_name.trim() || undefined,
        cont_tele: editForm.cont_tele.trim() || undefined,
        cont_mail: editForm.cont_mail.trim() || undefined,
        clie_addr: editForm.clie_addr.trim() || undefined,
        clie_memo: editForm.clie_memo.trim() || undefined,
      });
      invalidate();
      toast.success("고객사 정보가 수정되었습니다.");
      closeEdit();
    } catch {
      toast.error("수정에 실패했습니다.");
    }
  };

  return {
    // state
    search,
    setSearch,
    showForm,
    setShowForm,
    form,
    setForm,
    showEditForm,
    editingId,
    editForm,
    setEditForm,

    // data
    clients,
    isLoading,
    filteredCount,
    hasData,

    // mutations
    createMutation,
    updateMutation,

    // helpers
    resetForm,
    openCreate,
    closeCreate,
    openEdit,
    closeEdit,
    invalidate,
    handleCreate,
    handleUpdate,
  };
}

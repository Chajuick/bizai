// client/src/hooks/focuswin/clients/useClientsViewModel.ts

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { ClientFormState } from "@/types/client";

export function useClientsViewModel() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<ClientFormState>({
    clie_name: "",
    indu_type: "",
    cont_name: "",
    cont_tele: "",
    cont_mail: "",
    clie_addr: "",
    clie_memo: "",
  });

  const { data: clientsData, isLoading } = trpc.crm.client.list.useQuery({
    search: search || undefined,
  });

  const createMutation = trpc.crm.client.create.useMutation();
  const utils = trpc.useUtils();

  const clients = clientsData?.items ?? [];
  const filteredCount = useMemo(() => clients.length, [clients]);
  const hasData = filteredCount > 0;

  const resetForm = () => {
    setForm({
      clie_name: "",
      indu_type: "",
      cont_name: "",
      cont_tele: "",
      cont_mail: "",
      clie_addr: "",
      clie_memo: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const closeCreate = () => {
    setShowForm(false);
    resetForm();
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

  return {
    // state
    search,
    setSearch,
    showForm,
    setShowForm,
    form,
    setForm,

    // data
    clients,
    isLoading,
    filteredCount,
    hasData,

    // mutations
    createMutation,

    // helpers
    resetForm,
    openCreate,
    closeCreate,
    invalidate,
    handleCreate,
  };
}

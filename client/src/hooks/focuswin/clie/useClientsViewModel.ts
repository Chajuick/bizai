// client/src/hooks/focuswin/clients/useClientsViewModel.ts

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { ClientFormState } from "@/types/client";

export function useClientsViewModel() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<ClientFormState>({
    name: "",
    industry: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    notes: "",
  });

  const { data: clients, isLoading } = trpc.clients.list.useQuery({
    search: search || undefined,
  });

  const createMutation = trpc.clients.create.useMutation();
  const utils = trpc.useUtils();

  const filteredCount = useMemo(() => clients?.length ?? 0, [clients]);
  const hasData = filteredCount > 0;

  const resetForm = () => {
    setForm({
      name: "",
      industry: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      address: "",
      notes: "",
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

  const invalidate = () => utils.clients.list.invalidate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("고객사명을 입력해주세요.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: form.name.trim(),
        industry: form.industry.trim() || undefined,
        contactPerson: form.contactPerson.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
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
// client/src/hooks/focuswin/clients/useClientsViewModel.ts
"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { ClientFormState } from "@/components/focuswin/clients/clients.types";

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

    // mutations
    createMutation,

    // helpers
    resetForm,
    openCreate,
    closeCreate,
    invalidate,
  };
}
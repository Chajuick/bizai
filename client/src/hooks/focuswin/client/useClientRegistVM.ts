// client/src/hooks/focuswin/client/useClientRegistVM.ts

// #region Imports
import { useCallback, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { handleApiError } from "@/lib/handleApiError";
import type { ClientDraft, ContactDraft } from "@/types/client";

import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
// #endregion

// #region Helpers
const emptyClient = (): ClientDraft => ({
  clie_name: "",
  indu_type: "",
  clie_addr: "",
  clie_memo: "",
});

const ensureSingleMain = (rows: ContactDraft[], pickIndex: number) =>
  rows.map((r, i) => ({ ...r, main_yesn: i === pickIndex }));

const pickFirstAliveIndex = (rows: ContactDraft[]) => rows.findIndex((r) => r._state !== "delete");
// #endregion

export function useClientRegistVM() {
  // #region Router / Utils

  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const goList = useCallback(() => navigate("/clie-list"), [navigate]);
  const goDetail = useCallback((id: number) => navigate(`/clie-list/${id}`), [navigate]);

  // #endregion

  // #region Mutations

  const createWithContacts = trpc.crm.client.createWithContacts.useMutation();

  // #endregion

  // #region State

  const [clientForm, setClientForm] = useState<ClientDraft>(emptyClient());
  const [contactsDraft, setContactsDraft] = useState<ContactDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // #endregion

  // #region Derived

  const status: PageStatus = "ready";

  const aliveContacts = useMemo(
    () => contactsDraft.filter((c) => c._state !== "delete"),
    [contactsDraft]
  );

  // #endregion

  // #region Contact draft operations

  const addContact = useCallback(() => {
    setContactsDraft((prev) => {
      const alive = prev.filter((r) => r._state !== "delete");
      return [
        ...prev,
        {
          cont_name: "",
          cont_role: "",
          cont_tele: "",
          cont_mail: "",
          cont_memo: "",
          main_yesn: alive.length === 0,
          _state: "new" as const,
        },
      ];
    });
  }, []);

  const updateContact = useCallback((index: number, patch: Partial<ContactDraft>) => {
    setContactsDraft((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, ...patch } : r));
      if (patch.main_yesn === true) return ensureSingleMain(next, index);
      return next;
    });
  }, []);

  const removeContact = useCallback((index: number) => {
    setContactsDraft((prev) => {
      const row = prev[index];
      if (!row) return prev;

      const next = prev.map((r, i) =>
        i === index ? { ...r, _state: "delete" as const, main_yesn: false } : r
      );

      const alive = next.filter((r) => r._state !== "delete");
      if (alive.length > 0 && !alive.some((r) => r.main_yesn)) {
        const first = pickFirstAliveIndex(next);
        if (first >= 0) return ensureSingleMain(next, first);
      }

      return next;
    });
  }, []);

  // #endregion

  // #region Actions (submit)

  const submit = useCallback(async () => {
    if (!clientForm.clie_name.trim()) {
      toast.error("고객사명을 입력해주세요.");
      return;
    }

    for (const c of aliveContacts) {
      if (!c.cont_name.trim()) {
        toast.error("담당자 이름은 비워둘 수 없어요.");
        return;
      }
    }

    try {
      setIsSaving(true);

      const res = await createWithContacts.mutateAsync({
        client: clientForm,
        contacts: contactsDraft,
      });

      toast.success("고객사를 등록했어요.");
      await utils.crm.client.list.invalidate();
      goDetail(res.clie_idno);
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsSaving(false);
    }
  }, [clientForm, aliveContacts, contactsDraft, createWithContacts, utils, goDetail]);

  // #endregion

  // #region Actions UI Model

  const primaryAction = {
    label: "등록",
    onClick: submit,
    disabled: isSaving,
    variant: "primary" as const,
  };

  const actions = [
    {
      label: "취소",
      onClick: goList,
      variant: "outline" as const,
      disabled: isSaving,
    },
    {
      label: "담당자 추가",
      onClick: addContact,
      variant: "secondary" as const,
      disabled: isSaving,
    },
  ];

  // #endregion

  return {
    // status
    status,

    // navigation
    goList,

    // form
    clientForm,
    setClientForm,
    contactsDraft,
    addContact,
    updateContact,
    removeContact,

    // flags
    isSaving,

    // action models
    primaryAction,
    actions,
  };
}

// client/src/hooks/focuswin/client/useClientDetailVM.tsx

// #region Imports
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { handleApiError } from "@/lib/handleApiError";
import { buildDeleteConfirm } from "@/lib/confirm";

import type { PageInvalidState, PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import type { ConfirmState } from "@/components/focuswin/common/overlays/confirm-action-dialog";
import type { ClientDraft, ContactDraft } from "@/types/client";
import type { RouterOutputs } from "@/types";

import { BookMarked, Check, List, Loader2, Pencil, Trash2, XCircle, UserPlus } from "lucide-react";
// #endregion

// #region Types
type ClientContactRow = RouterOutputs["crm"]["client"]["contact"]["list"][number];
// #endregion

// #region Helpers
const emptyClientDraft = (): ClientDraft => ({
  clie_idno: undefined,
  clie_name: "",
  bizr_numb: "",
  indu_type: "",
  clie_addr: "",
  clie_memo: "",
});

function toContactDrafts(rows: ClientContactRow[]): ContactDraft[] {
  return (rows ?? []).map((c) => ({
    cont_idno: c.cont_idno,
    cont_name: c.cont_name ?? "",
    cont_role: c.cont_role ?? "",
    cont_tele: c.cont_tele ?? "",
    cont_mail: c.cont_mail ?? "",
    cont_memo: c.cont_memo ?? "",
    main_yesn: !!c.main_yesn,
    _state: "keep" as const,
  }));
}

function ensureSingleMain(rows: ContactDraft[], pickIndex: number) {
  return rows.map((r, i) => ({ ...r, main_yesn: i === pickIndex }));
}

function pickFirstAliveIndex(rows: ContactDraft[]) {
  return rows.findIndex((r) => r._state !== "delete");
}
// #endregion

export function useClientDetailVM() {
  // #region Router / Utils

  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const clientId = Number(id);

  const goList = useCallback(() => navigate("/clie-list"), [navigate]);

  // #endregion

  // #region Queries / Mutations

  const clientGet = trpc.crm.client.get.useQuery(
    { clie_idno: clientId },
    { enabled: Number.isFinite(clientId) }
  );

  const contactsList = trpc.crm.client.contact.list.useQuery(
    { clie_idno: clientId },
    { enabled: Number.isFinite(clientId) }
  );

  const logsQuery = trpc.crm.sale.list.useQuery(
    { clie_idno: clientId },
    { enabled: Number.isFinite(clientId) }
  );

  const ordersQuery = trpc.crm.order.list.useQuery(
    { clie_idno: clientId },
    { enabled: Number.isFinite(clientId) }
  );

  const saveWithContacts = trpc.crm.client.saveWithContacts.useMutation();
  const deleteClient = trpc.crm.client.delete.useMutation();

  // #endregion

  // #region State

  const [isEditing, setIsEditing] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const [clientForm, setClientForm] = useState<ClientDraft>(emptyClientDraft());
  const [contactsDraft, setContactsDraft] = useState<ContactDraft[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  // #endregion

  // #region Derived (Base)

  const client = clientGet.data ?? null;
  const isLoading = clientGet.isLoading;

  const title = useMemo(() => client?.clie_name || "고객사", [client?.clie_name]);
  const status: PageStatus = isLoading ? "loading" : !client ? "empty" : "ready";

  const invalidState = useMemo(() => {
    if (isLoading || client) return null;

    return {
      replacePage: true,
      icon: <BookMarked size={24} />,
      title: "고객사",
      actions: [{ label: "목록으로", icon: <List size={16} />, onClick: goList }],
    } satisfies PageInvalidState;
  }, [isLoading, client, goList]);

  // #endregion

  // #region Derived (KPI)

  const orders = ordersQuery.data?.items ?? [];

  const totalOrderAmount = useMemo(() => {
    return orders
      .filter((o) => o.stat_code !== "canceled")
      .reduce((sum, o) => sum + Number(o.orde_pric || 0), 0);
  }, [orders]);

  // #endregion

  // #region Effects (server → drafts)

  useEffect(() => {
    if (!client) return;

    setClientForm({
      clie_idno: client.clie_idno,
      clie_name: client.clie_name ?? "",
      bizr_numb: client.bizr_numb ?? "",
      indu_type: client.indu_type ?? "",
      clie_addr: client.clie_addr ?? "",
      clie_memo: client.clie_memo ?? "",
    });
  }, [client]);

  useEffect(() => {
    setContactsDraft(toContactDrafts(contactsList.data ?? []));
  }, [contactsList.data]);

  // #endregion

  // #region UI Helpers

  const startEdit = () => setIsEditing(true);

  const cancelEdit = () => {
    if (client) {
      setClientForm({
        clie_idno: client.clie_idno,
        clie_name: client.clie_name ?? "",
        bizr_numb: client.bizr_numb ?? "",
        indu_type: client.indu_type ?? "",
        clie_addr: client.clie_addr ?? "",
        clie_memo: client.clie_memo ?? "",
      });
    }
    setContactsDraft(toContactDrafts(contactsList.data ?? []));
    setIsEditing(false);
  };

  // #endregion

  // #region Contact draft operations

  const addContact = () => {
    setContactsDraft((prev) => {
      const alive = prev.filter((r) => r._state !== "delete");
      return [
        ...prev,
        {
          cont_idno: undefined,
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
  };

  const updateContact = (index: number, patch: Partial<ContactDraft>) => {
    setContactsDraft((prev) => {
      const next = prev.map((r, i) => {
        if (i !== index) return r;
        const merged: ContactDraft = { ...r, ...patch };
        if (r._state === "keep") merged._state = "update";
        return merged;
      });

      if (patch.main_yesn === true) return ensureSingleMain(next, index);
      return next;
    });
  };

  const removeContact = (index: number) => {
    setContactsDraft((prev) => {
      const row = prev[index];
      if (!row) return prev;

      // 신규는 그냥 제거
      if (!row.cont_idno) {
        const next = prev.filter((_, i) => i !== index);
        const alive = next.filter((r) => r._state !== "delete");
        if (alive.length > 0 && !alive.some((r) => r.main_yesn)) {
          const first = pickFirstAliveIndex(next);
          if (first >= 0) return ensureSingleMain(next, first);
        }
        return next;
      }

      // 기존은 delete 마킹
      const next = prev.map((r, i) => (i === index ? { ...r, _state: "delete" as const, main_yesn: false } : r));

      const alive = next.filter((r) => r._state !== "delete");
      if (alive.length > 0 && !alive.some((r) => r.main_yesn)) {
        const first = pickFirstAliveIndex(next);
        if (first >= 0) return ensureSingleMain(next, first);
      }

      return next;
    });
  };

  // #endregion

  // #region Actions (aggregate save)

  const submit = useCallback(async () => {
    if (!clientForm.clie_name.trim()) {
      toast.error("고객사명을 입력해주세요.");
      return;
    }

    if (clientForm.bizr_numb && !/^\d{10}$/.test(clientForm.bizr_numb)) {
      toast.error("사업자번호는 숫자 10자리여야 합니다.");
      return;
    }

    const aliveContacts = contactsDraft.filter((c) => c._state !== "delete");
    for (const c of aliveContacts) {
      if (!c.cont_name.trim()) {
        toast.error("담당자 이름은 비워둘 수 없어요.");
        return;
      }
    }

    try {
      setIsSaving(true);

      await saveWithContacts.mutateAsync({
        client: {
          clie_idno: clientId,
          clie_name: clientForm.clie_name,
          bizr_numb: clientForm.bizr_numb || null,
          indu_type: clientForm.indu_type,
          clie_addr: clientForm.clie_addr,
          clie_memo: clientForm.clie_memo,
        },
        contacts: contactsDraft,
      });

      toast.success("저장했어요.");

      await utils.crm.client.get.invalidate({ clie_idno: clientId });
      await utils.crm.client.contact.list.invalidate({ clie_idno: clientId });

      setIsEditing(false);
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsSaving(false);
    }
  }, [clientForm, contactsDraft, saveWithContacts, utils, clientId]);

  // #endregion

  // #region Actions (delete - confirm)

  const requestDeleteClient = () => {
    if (!client) return;

    setConfirm(
      buildDeleteConfirm({
        kind: "client",
        id: client.clie_idno,
        title: client.clie_name || "해당 고객사",
        metas: [{ label: "고객사", value: client.clie_name || "-" }],
      })
    );
  };

  const handleConfirmAction = async (c: NonNullable<ConfirmState>) => {
    if (c.intent !== "delete") return;

    await deleteClient.mutateAsync({ clie_idno: c.target.id });
    toast.success("고객사를 삭제했어요.");
    setConfirm(null);
    await utils.crm.client.list.invalidate();
    goList();
  };

  // #endregion

  // #region Actions UI Model

  const primaryAction = isEditing
    ? {
        label: "저장",
        icon: isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />,
        onClick: submit,
        disabled: isSaving,
        variant: "primary" as const,
      }
    : undefined;

  const actions = isEditing
    ? [
        {
          label: "취소",
          icon: <XCircle size={16} />,
          onClick: cancelEdit,
          variant: "outline" as const,
        },
      ]
    : [
        {
          label: "수정",
          icon: <Pencil size={16} />,
          onClick: startEdit,
          variant: "ghost" as const,
        },
        {
          label: "삭제",
          icon: <Trash2 size={16} />,
          onClick: requestDeleteClient,
          variant: "ghost" as const,
        },
      ];

  // #endregion

  // #region Modal props

  const modalProps = {
    confirm,
    setConfirm,
    onConfirm: handleConfirmAction,
  };

  // #endregion

  return {
    // base
    clientId,
    client,
    title,
    status,
    invalidState,

    // navigation
    goList,

    // related
    logs: logsQuery.data?.items ?? [],
    logsLoading: logsQuery.isLoading,
    orders: ordersQuery.data?.items ?? [],
    ordersLoading: ordersQuery.isLoading,
    totalOrderAmount,

    // editing
    isEditing,
    clientForm,
    setClientForm,

    contactsDraft,
    addContact,
    updateContact,
    removeContact,

    // actions
    primaryAction,
    actions,

    // modal
    modalProps,

    // raw queries (필요시)
    clientGet,
    contactsList,
  };
}

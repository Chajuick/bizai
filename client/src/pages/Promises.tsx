import React, { useMemo, useState } from "react";
import { usePromiseAlerts } from "@/hooks/usePromiseAlerts";
import { Plus, Calendar } from "lucide-react";
import { toLocalDatetimeInputValue, toLocalDateInputValue } from "@/lib/utils";

import PageHeader from "@/components/focuswin/page-header";
import TabPills, { TabPill } from "@/components/focuswin/tab-pills";

import EmptyState from "@/components/focuswin/empty-state";
import SkeletonCardList from "@/components/focuswin/skeleton-card-list";
import ListNotice from "@/components/focuswin/list-notice";
import PromiseFormDialog, { PromiseFormState } from "@/components/focuswin/promise-form-dialog";
import CreateOrderDialog, { OrderFormState } from "@/components/focuswin/create-order-dialog";
import ConfirmActionDialog, { ConfirmState } from "@/components/focuswin/confirm-action-dialog";
import PromiseCard from "@/components/focuswin/promise/promise-card";
import PageShell from "@/components/focuswin/common/page-shell";

import { usePromisesViewModel } from "@/hooks/focuswin/promise/usePromisesViewModel";
import type { TabKey } from "@/hooks/focuswin/promise/usePromisesViewModel";
import { usePromiseActions } from "@/hooks/focuswin/promise/usePromiseActions";
import Fab from "@/components/focuswin/fab";

export default function Promises() {
  const { activeTab, setActiveTab, isLoading, displayList, counts, overdueInList, imminentInList } = usePromisesViewModel();

  usePromiseAlerts(overdueInList, imminentInList);

  const actions = usePromiseActions();

  // UI states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PromiseFormState>({
    clientName: "",
    clientId: undefined,
    title: "",
    description: "",
    scheduledAt: "",
  });

  const [selectedPromise, setSelectedPromise] = useState<any>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormState>({
    productService: "",
    amount: "",
    status: "proposal",
    contractDate: "",
    notes: "",
  });

  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      clientName: "",
      clientId: undefined,
      title: "",
      description: "",
      scheduledAt: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const statusTabs = useMemo<TabPill<TabKey>[]>(
    () => [
      { key: "all", label: "전체", count: counts.all },
      { key: "imminent", label: "임박", count: counts.imminent },
      { key: "scheduled", label: "예정", count: counts.scheduled },
      { key: "completed", label: "완료", count: counts.completed },
      { key: "overdue", label: "지연", count: counts.overdue },
      { key: "canceled", label: "취소", count: counts.canceled },
    ],
    [counts]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) return actions.toast.error("제목과 일시를 입력해주세요.");

    try {
      await actions.createPromise({
        clientId: form.clientId,
        clientName: form.clientName || undefined,
        title: form.title,
        description: form.description || undefined,
        scheduledAt: form.scheduledAt,
      });

      actions.toast.success("일정이 등록되었습니다.");
      setShowForm(false);
      resetForm();
    } catch {
      actions.toast.error("등록에 실패했습니다.");
    }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      clientName: p.clientName || "",
      clientId: p.clientId ?? undefined,
      title: p.title,
      description: p.description || "",
      scheduledAt: toLocalDatetimeInputValue(new Date(p.scheduledAt)),
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!form.title || !form.scheduledAt) return actions.toast.error("제목과 일시를 입력해주세요.");

    try {
      await actions.updatePromise({
        id: editingId,
        title: form.title,
        clientName: form.clientName || undefined,
        description: form.description || undefined,
        scheduledAt: form.scheduledAt,
      });

      actions.toast.success("일정이 수정되었습니다.");
      setShowForm(false);
      resetForm();
    } catch {
      actions.toast.error("수정에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await actions.deletePromise({ id });
      actions.toast.success("삭제되었습니다.");
    } catch {
      actions.toast.error("삭제에 실패했습니다.");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await actions.completePromise({ id });
      actions.toast.success("완료 처리되었습니다.");
    } catch {
      actions.toast.error("처리에 실패했습니다.");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await actions.cancelPromise({ id });
      actions.toast.success("취소되었습니다.");
    } catch {
      actions.toast.error("처리에 실패했습니다.");
    }
  };

  const openOrderForm = (p: any) => {
    setSelectedPromise(p);
    setOrderForm({
      productService: "",
      amount: p.amount ? String(Math.round(Number(p.amount))) : "",
      status: "proposal",
      contractDate: toLocalDateInputValue(new Date(p.scheduledAt)),
      notes: p.description || "",
    });
    setShowOrderForm(true);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromise || !orderForm.productService || !orderForm.amount) {
      return actions.toast.error("필수 항목을 입력해주세요.");
    }

    const promiseId = selectedPromise?.id;

    try {
      await actions.createOrderAndCompletePromise({
        order: {
          clientName: selectedPromise.clientName || "",
          productService: orderForm.productService,
          amount: Number(orderForm.amount),
          status: orderForm.status,
          contractDate: orderForm.contractDate || undefined,
          notes: orderForm.notes || undefined,
        },
        promiseId,
      });

      actions.toast.success("수주가 생성되었습니다.");

      setShowOrderForm(false);
      setSelectedPromise(null);
      setOrderForm({
        productService: "",
        amount: "",
        status: "proposal",
        contractDate: "",
        notes: "",
      });
    } catch {
      actions.toast.error("수주 생성에 실패했습니다.");
    }
  };

  const requestCancel = (p: any) => setConfirm({ type: "cancel", id: p.id, title: p.title });
  const requestDelete = (p: any) => setConfirm({ type: "delete", id: p.id, title: p.title });

  const hasData = displayList.length > 0;

  return (
    <PageShell>
      <PageHeader
        kicker="SCHEDULE"
        title="일정 관리"
        description="후속 미팅과 할 일을 상태별로 관리하세요."
        primaryAction={{
          label: "일정 추가",
          onClick: openCreate,
          icon: <Plus size={16} />,
        }}
      >
        <TabPills<TabKey> tabs={statusTabs} value={activeTab} onChange={setActiveTab} />
      </PageHeader>

      <div className="mt-4">
        {(overdueInList > 0 || imminentInList > 0) && (
          <ListNotice tone={overdueInList > 0 ? "warning" : "primary"} className="mb-2">
            {overdueInList > 0 ? `지연 ${overdueInList}건` : null}
            {overdueInList > 0 && imminentInList > 0 ? " · " : null}
            {imminentInList > 0 ? `임박 ${imminentInList}건` : null}이 있어요.
          </ListNotice>
        )}

        {isLoading ? (
          <SkeletonCardList count={4} variant="simple" />
        ) : !hasData ? (
          <EmptyState
            icon={<Calendar size={26} className="text-blue-600" />}
            title="일정이 없습니다"
            description="영업일지 AI 분석 시 자동으로 등록됩니다"
            actions={[
              {
                label: "일정 추가",
                onClick: openCreate,
                icon: <Plus size={16} />,
                variant: "primary",
              },
            ]}
            className="py-16"
          />
        ) : (
          <div className="space-y-2">
            {displayList.map((p: any) => (
              <PromiseCard
                key={p.id}
                p={p}
                onCreateOrder={openOrderForm}
                onComplete={handleComplete}
                onEdit={handleEdit}
                onCancelRequest={requestCancel}
                onDeleteRequest={requestDelete}
                completePending={actions.complete.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ FAB: SalesLogs와 동일 룩/위치 */}
      <Fab onClick={openCreate} label="일정 추가">
        <Plus size={24} />
      </Fab>

      {/* Dialogs */}
      <PromiseFormDialog
        open={showForm}
        onOpenChange={o => {
          setShowForm(o);
          if (!o) resetForm();
        }}
        editing={!!editingId}
        form={form}
        setForm={setForm}
        onSubmit={editingId ? handleUpdate : handleCreate}
        isSubmitting={actions.create.isPending || actions.update.isPending}
      />

      <CreateOrderDialog
        open={showOrderForm}
        onOpenChange={setShowOrderForm}
        selectedPromise={selectedPromise}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        onSubmit={handleCreateOrder}
        isSubmitting={actions.createOrder.isPending}
      />

      <ConfirmActionDialog
        confirm={confirm}
        setConfirm={setConfirm}
        onConfirm={async c => {
          if (c.type === "delete") await handleDelete(c.id);
          if (c.type === "cancel") await handleCancel(c.id);
        }}
      />
    </PageShell>
  );
}

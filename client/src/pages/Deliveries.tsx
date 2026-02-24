"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, TrendingUp, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";

// ✅ shadcn
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type BillingStatus = "unbilled" | "billed" | "paid";
type DeliveryStatus = "pending" | "delivered" | "invoiced" | "paid";

const billingTabs: { key: BillingStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "unbilled", label: "미청구" },
  { key: "billed", label: "청구완료" },
  { key: "paid", label: "수금완료" },
];

const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  pending: "대기",
  delivered: "납품완료",
  invoiced: "청구완료",
  paid: "수금완료",
};

export default function Deliveries() {
  const [activeTab, setActiveTab] = useState<BillingStatus | "all">("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<null | { id: number; title: string }>(null);

  const [form, setForm] = useState({
    orderId: "",
    clientName: "",
    revenueAmount: "",
    deliveryStatus: "pending" as DeliveryStatus,
    deliveredAt: "",
    billingStatus: "unbilled" as BillingStatus,
    notes: "",
  });

  const { data: deliveries, isLoading } = trpc.deliveries.list.useQuery(
    activeTab !== "all" ? { billingStatus: activeTab } : undefined
  );
  const { data: orders } = trpc.orders.list.useQuery({ status: "confirmed" });

  const createMutation = trpc.deliveries.create.useMutation();
  const updateMutation = trpc.deliveries.update.useMutation();
  const deleteMutation = trpc.deliveries.delete?.useMutation?.(); // ✅ 라우터 없으면 optional
  const utils = trpc.useUtils();

  const resetForm = () => {
    setEditingId(null);
    setForm({
      orderId: "",
      clientName: "",
      revenueAmount: "",
      deliveryStatus: "pending",
      deliveredAt: "",
      billingStatus: "unbilled",
      notes: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const formatKRW = (n: number) => {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
    if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`;
    return `${n.toLocaleString()}원`;
  };

  const stats = useMemo(() => {
    const arr = deliveries ?? [];
    const paid = arr.filter((d) => d.billingStatus === "paid").reduce((s, d) => s + Number(d.revenueAmount || 0), 0);
    const pending = arr.filter((d) => d.billingStatus !== "paid").reduce((s, d) => s + Number(d.revenueAmount || 0), 0);
    return { paid, pending };
  }, [deliveries]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.revenueAmount) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }

    try {
      const payload = {
        orderId: Number(form.orderId) || 0,
        clientName: form.clientName,
        revenueAmount: Number(form.revenueAmount),
        deliveryStatus: form.deliveryStatus,
        deliveredAt: form.deliveredAt || undefined,
        billingStatus: form.billingStatus,
        notes: form.notes || undefined,
      };

      if (!editingId) {
        await createMutation.mutateAsync(payload);
        toast.success("납품 건이 등록되었습니다.");
      } else {
        await updateMutation.mutateAsync({ id: editingId, ...payload });
        toast.success("납품 건이 수정되었습니다.");
      }

      utils.deliveries.list.invalidate();
      utils.dashboard.stats.invalidate();
      setShowForm(false);
      resetForm();
    } catch {
      toast.error(editingId ? "수정에 실패했습니다." : "등록에 실패했습니다.");
    }
  };

  const handleBillingUpdate = async (id: number, billingStatus: BillingStatus) => {
    try {
      await updateMutation.mutateAsync({ id, billingStatus });
      utils.deliveries.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("청구 상태가 변경되었습니다.");
    } catch {
      toast.error("변경에 실패했습니다.");
    }
  };

  const handleEdit = (d: any) => {
    setEditingId(d.id);
    setForm({
      orderId: d.orderId ? String(d.orderId) : "",
      clientName: d.clientName || "",
      revenueAmount: String(d.revenueAmount ?? ""),
      deliveryStatus: d.deliveryStatus as DeliveryStatus,
      deliveredAt: d.deliveredAt ? new Date(d.deliveredAt).toISOString().split("T")[0] : "",
      billingStatus: d.billingStatus as BillingStatus,
      notes: d.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!deleteMutation) {
      toast.error("삭제 API가 아직 연결되어 있지 않아요.");
      return;
    }
    try {
      await deleteMutation.mutateAsync({ id });
      utils.deliveries.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* ✅ Toss-style sticky header */}
      <div
        className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b mb-4"
        style={{
          background: "rgba(255,255,255,0.86)",
          borderColor: "rgba(15,23,42,0.08)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
              DELIVERIES
            </p>
            <h1 className="text-base sm:text-lg font-black text-slate-900">납품/매출</h1>
            <p className="mt-1 text-sm text-slate-500">청구/수금 상태를 한 번에 관리해요.</p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white transition active:scale-[0.99]"
            style={{
              background: "rgb(37, 99, 235)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
            }}
          >
            <Plus size={16} />
            납품 등록
          </button>
        </div>

        {/* ✅ Summary */}
        {!isLoading && (deliveries?.length ?? 0) > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
              <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">
                PAID
              </p>
              <p className="mt-0.5 text-base font-black text-slate-900">{formatKRW(stats.paid)}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">수금 완료</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
              <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">
                PENDING
              </p>
              <p className="mt-0.5 text-base font-black text-slate-900">{formatKRW(stats.pending)}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">미수금</p>
            </div>
          </div>
        )}

        {/* ✅ Tabs (chip) */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {billingTabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition"
                style={
                  active
                    ? {
                        background: "rgba(37,99,235,0.10)",
                        borderColor: "rgba(37,99,235,0.25)",
                        color: "rgb(37,99,235)",
                      }
                    : {
                        background: "white",
                        borderColor: "rgba(15,23,42,0.08)",
                        color: "rgb(100,116,139)",
                      }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-100 bg-white p-4 animate-pulse"
              style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100" />
                <div className="flex-1">
                  <div className="h-3 w-40 bg-slate-100 rounded mb-2" />
                  <div className="h-3 w-full bg-slate-100 rounded mb-2" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (deliveries?.length ?? 0) === 0 ? (
        <div className="text-center py-14">
          <div className="mx-auto w-14 h-14 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <TrendingUp size={26} className="text-blue-600" />
          </div>
          <p className="mt-4 text-base font-black text-slate-900">납품 건이 없습니다</p>
          <p className="mt-1 text-sm text-slate-500">“납품 등록”으로 첫 매출을 추가해보세요.</p>
          <div className="mt-5 flex justify-center">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: "rgb(37, 99, 235)" }}
            >
              <Plus size={16} />
              납품 등록하기
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {deliveries?.map((d) => (
            <div
              key={d.id}
              className="group rounded-3xl border border-slate-100 bg-white p-4 transition"
              style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp size={16} className="text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-900 text-sm truncate">{d.clientName}</p>
                    <StatusBadge status={d.billingStatus} />
                    <StatusBadge status={d.deliveryStatus} />
                  </div>

                  <p className="mt-1 text-lg font-black text-slate-900">
                    {formatKRW(Number(d.revenueAmount))}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      {d.deliveredAt ? (
                        <p className="text-xs font-semibold text-slate-500">
                          납품일: {new Date(d.deliveredAt).toLocaleDateString("ko-KR")}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400">납품일 미입력</p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-500">
                        진행: {deliveryStatusLabels[d.deliveryStatus as DeliveryStatus] ?? d.deliveryStatus}
                      </p>
                    </div>

                    {/* ✅ 1-탭 액션: 청구/수금만 노출 */}
                    <div className="flex items-center gap-2 shrink-0">
                      {d.billingStatus === "unbilled" && (
                        <button
                          onClick={() => handleBillingUpdate(d.id, "billed")}
                          disabled={updateMutation.isPending}
                          className="px-3 py-2 rounded-2xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                        >
                          청구 처리
                        </button>
                      )}
                      {d.billingStatus === "billed" && (
                        <button
                          onClick={() => handleBillingUpdate(d.id, "paid")}
                          disabled={updateMutation.isPending}
                          className="px-3 py-2 rounded-2xl text-xs font-bold text-white transition disabled:opacity-50"
                          style={{
                            background: "rgb(37, 99, 235)",
                            boxShadow: "0 10px 26px rgba(37,99,235,0.18)",
                          }}
                        >
                          수금 완료
                        </button>
                      )}

                      {/* ✅ 더보기(수정/삭제) */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="w-9 h-9 rounded-2xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center"
                            title="더보기"
                          >
                            <MoreHorizontal size={16} className="text-slate-700" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-1">
                          <DropdownMenuItem
                            onClick={() => handleEdit(d)}
                            className="rounded-xl flex items-center gap-2"
                          >
                            <Pencil size={14} className="text-slate-700" />
                            수정
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => setConfirmDelete({ id: d.id, title: d.clientName })}
                            className="rounded-xl flex items-center gap-2 text-red-600 focus:text-red-600"
                          >
                            <Trash2 size={14} />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        className="fixed bottom-20 right-5 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-[0_12px_28px_rgba(37,99,235,0.30)] lg:hidden"
        style={{ background: "rgb(37, 99, 235)" }}
        onClick={openCreate}
        aria-label="납품 등록"
      >
        <Plus size={24} />
      </button>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(o) => {
          setShowForm(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="rounded-3xl border border-slate-100 bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-black">
              {editingId ? "납품 수정" : "납품 등록"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            {/* ✅ 연결 수주(선택) - shadcn Select 없이도 토스톤 유지 */}
            {!!orders?.length && (
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">연결 수주(선택)</Label>
                <select
                  value={form.orderId}
                  onChange={(e) => {
                    const v = e.target.value;
                    const order = orders.find((o) => String(o.id) === v);
                    setForm((f) => ({
                      ...f,
                      orderId: v,
                      clientName: order?.clientName || f.clientName,
                      revenueAmount: order ? String(order.amount) : f.revenueAmount,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="">선택 안함</option>
                  {orders.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.clientName} - {o.productService}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">고객사 *</Label>
              <Input
                value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                required
                className="rounded-2xl border-slate-200"
                placeholder="(주)OOO"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">매출 금액(원) *</Label>
              <Input
                type="number"
                value={form.revenueAmount}
                onChange={(e) => setForm((f) => ({ ...f, revenueAmount: e.target.value }))}
                required
                className="rounded-2xl border-slate-200"
                placeholder="5000000"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">납품 상태</Label>
                <select
                  value={form.deliveryStatus}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryStatus: e.target.value as DeliveryStatus }))}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="pending">대기</option>
                  <option value="delivered">납품완료</option>
                  <option value="invoiced">청구완료</option>
                  <option value="paid">수금완료</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">청구 상태</Label>
                <select
                  value={form.billingStatus}
                  onChange={(e) => setForm((f) => ({ ...f, billingStatus: e.target.value as BillingStatus }))}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="unbilled">미청구</option>
                  <option value="billed">청구완료</option>
                  <option value="paid">수금완료</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">납품일</Label>
              <Input
                type="date"
                value={form.deliveredAt}
                onChange={(e) => setForm((f) => ({ ...f, deliveredAt: e.target.value }))}
                className="rounded-2xl border-slate-200"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">메모</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="rounded-2xl border-slate-200 resize-none"
                placeholder="선택 입력"
              />
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full rounded-2xl text-white font-bold"
              style={{
                background: "rgb(37, 99, 235)",
                boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
              }}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              {editingId ? "수정" : "등록"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">납품 건을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              <span className="font-semibold text-slate-900">{confirmDelete?.title}</span> 항목을 삭제하면
              복구할 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">아니요</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl"
              onClick={async () => {
                if (!confirmDelete) return;
                await handleDelete(confirmDelete.id);
                setConfirmDelete(null);
              }}
              style={{ background: "rgb(239,68,68)" }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  ShoppingCart,
  Loader2,
  Package,
  MoreHorizontal,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";

// ✅ shadcn
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

type OrderStatus = "proposal" | "negotiation" | "confirmed" | "canceled";

const statusTabs: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "proposal", label: "제안" },
  { key: "negotiation", label: "협상" },
  { key: "confirmed", label: "확정" },
  { key: "canceled", label: "취소" },
];

export default function Orders() {
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    clientName: "",
    productService: "",
    amount: "",
    status: "proposal" as OrderStatus,
    contractDate: "",
    expectedDeliveryDate: "",
    notes: "",
  });

  const [deliveryForm, setDeliveryForm] = useState({
    revenueAmount: "",
    deliveryStatus: "pending" as "pending" | "delivered" | "invoiced" | "paid",
    deliveredAt: "",
    billingStatus: "unbilled" as "unbilled" | "billed" | "paid",
    notes: "",
  });

  const [confirm, setConfirm] = useState<null | { id: number; title: string }>(null);

  const { data: orders, isLoading } = trpc.orders.list.useQuery(
    activeTab !== "all" ? { status: activeTab } : undefined
  );

  const createMutation = trpc.orders.create.useMutation();
  const updateMutation = trpc.orders.update.useMutation();
  const deleteMutation = trpc.orders.delete.useMutation();
  const createDeliveryMutation = trpc.deliveries.create.useMutation();
  const utils = trpc.useUtils();

  const resetForm = () => {
    setEditingId(null);
    setForm({
      clientName: "",
      productService: "",
      amount: "",
      status: "proposal",
      contractDate: "",
      expectedDeliveryDate: "",
      notes: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.productService || !form.amount) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        ...form,
        amount: Number(form.amount),
        contractDate: form.contractDate || undefined,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        notes: form.notes || undefined,
      });
      utils.orders.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("수주가 등록되었습니다.");
      setShowForm(false);
      resetForm();
    } catch {
      toast.error("등록에 실패했습니다.");
    }
  };

  const handleEdit = (order: any) => {
    setEditingId(order.id);
    setForm({
      clientName: order.clientName,
      productService: order.productService,
      amount: String(order.amount ?? ""),
      status: order.status,
      contractDate: order.contractDate ? new Date(order.contractDate).toISOString().split("T")[0] : "",
      expectedDeliveryDate: order.expectedDeliveryDate
        ? new Date(order.expectedDeliveryDate).toISOString().split("T")[0]
        : "",
      notes: order.notes || "",
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!form.clientName || !form.productService || !form.amount) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        clientName: form.clientName,
        productService: form.productService,
        amount: Number(form.amount),
        status: form.status,
        contractDate: form.contractDate || undefined,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        notes: form.notes || undefined,
      });
      utils.orders.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("수주가 수정되었습니다.");
      setShowForm(false);
      resetForm();
    } catch {
      toast.error("수정에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      utils.orders.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("수주가 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !deliveryForm.revenueAmount) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    try {
      await createDeliveryMutation.mutateAsync({
        orderId: selectedOrder.id,
        clientName: selectedOrder.clientName,
        revenueAmount: Number(deliveryForm.revenueAmount),
        deliveryStatus: deliveryForm.deliveryStatus,
        deliveredAt: deliveryForm.deliveredAt || undefined,
        billingStatus: deliveryForm.billingStatus,
        notes: deliveryForm.notes || undefined,
      });

      utils.deliveries.list.invalidate();
      utils.orders.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("납품이 생성되었습니다.");

      setShowDeliveryForm(false);
      setSelectedOrder(null);
      setDeliveryForm({
        revenueAmount: "",
        deliveryStatus: "pending",
        deliveredAt: "",
        billingStatus: "unbilled",
        notes: "",
      });
    } catch {
      toast.error("납품 생성에 실패했습니다.");
    }
  };

  const handleStatusChange = async (id: number, status: OrderStatus) => {
    try {
      await updateMutation.mutateAsync({ id, status });
      utils.orders.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("상태가 변경되었습니다.");
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const stats = useMemo(() => {
    const rows = orders ?? [];
    const total = rows
      .filter((o) => o.status !== "canceled")
      .reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const confirmed = rows
      .filter((o) => o.status === "confirmed")
      .reduce((sum, o) => sum + Number(o.amount || 0), 0);
    return { total, confirmed };
  }, [orders]);

  const formatKRW = (n: number) => {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
    if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`;
    return `${n.toLocaleString()}원`;
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header (토스식 sticky) */}
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
              ORDERS
            </p>
            <h1 className="text-base sm:text-lg font-black text-slate-900">수주 관리</h1>
            <p className="mt-1 text-sm text-slate-500">파이프라인을 한눈에 보고, 상태를 빠르게 정리하세요.</p>
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
            수주 등록
          </button>
        </div>

        {/* KPI mini cards */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
            <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">
              PIPELINE
            </p>
            <p className="mt-0.5 text-base font-black text-slate-900">{formatKRW(stats.total)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
            <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">
              CONFIRMED
            </p>
            <p className="mt-0.5 text-base font-black text-slate-900">{formatKRW(stats.confirmed)}</p>
          </div>
        </div>

        {/* Tabs (chip) */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
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
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-100 bg-white p-4 animate-pulse"
              style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
            >
              <div className="h-3 w-40 bg-slate-100 rounded mb-2" />
              <div className="h-3 w-full bg-slate-100 rounded mb-2" />
              <div className="h-3 w-2/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (orders?.length ?? 0) === 0 ? (
        <div className="text-center py-14">
          <div className="mx-auto w-14 h-14 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <ShoppingCart size={26} className="text-blue-600" />
          </div>
          <p className="mt-4 text-base font-black text-slate-900">수주가 없습니다</p>
          <p className="mt-1 text-sm text-slate-500">
            일정에서 수주를 생성하거나, “수주 등록”으로 직접 추가할 수 있어요.
          </p>
          <div className="mt-5 flex justify-center">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: "rgb(37, 99, 235)" }}
            >
              <Plus size={16} />
              수주 등록하기
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {orders?.map((order) => (
            <div
              key={order.id}
              className="group rounded-3xl border border-slate-100 bg-white p-4 transition"
              style={{
                boxShadow: "0 10px 26px rgba(15,23,42,0.04)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingCart size={16} className="text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-900 text-sm truncate">
                      {order.clientName}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>

                  <p className="mt-1 text-sm text-slate-600 line-clamp-1">
                    {order.productService}
                  </p>

                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="text-lg font-black text-slate-900">
                      {formatKRW(Number(order.amount))}
                    </p>

                    {/* 상태 변경은 버튼 난립 대신 1줄로 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">상태</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        disabled={updateMutation.isPending}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                      >
                        <option value="proposal">제안</option>
                        <option value="negotiation">협상</option>
                        <option value="confirmed">확정</option>
                        <option value="canceled">취소</option>
                      </select>
                    </div>
                  </div>

                  {order.expectedDeliveryDate && (
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      납기: {new Date(order.expectedDeliveryDate).toLocaleDateString("ko-KR")}
                    </p>
                  )}
                </div>

                {/* Actions (토스식: 핵심 1개 + 더보기) */}
                <div className="flex items-center gap-1 shrink-0">
                  {order.status === "confirmed" && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDeliveryForm(true);
                      }}
                      className="w-9 h-9 rounded-2xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center"
                      title="납품 생성"
                    >
                      <Package size={16} className="text-slate-700" />
                    </button>
                  )}

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
                        onClick={() => handleEdit(order)}
                        className="rounded-xl flex items-center gap-2"
                      >
                        <Edit2 size={14} className="text-slate-700" />
                        수정
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => setConfirm({ id: order.id, title: order.productService })}
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
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        className="fixed bottom-20 right-5 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-[0_12px_28px_rgba(37,99,235,0.30)] lg:hidden"
        style={{ background: "rgb(37, 99, 235)" }}
        onClick={openCreate}
        aria-label="수주 등록"
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
              {editingId ? "수주 수정" : "수주 등록"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
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
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">상품/서비스 *</Label>
              <Input
                value={form.productService}
                onChange={(e) => setForm((f) => ({ ...f, productService: e.target.value }))}
                required
                className="rounded-2xl border-slate-200"
                placeholder="예: 소프트웨어 개발"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">금액(원) *</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
                className="rounded-2xl border-slate-200"
                placeholder="5000000"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">상태</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as OrderStatus }))}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="proposal">제안</option>
                  <option value="negotiation">협상</option>
                  <option value="confirmed">확정</option>
                  <option value="canceled">취소</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">계약일</Label>
                <Input
                  type="date"
                  value={form.contractDate}
                  onChange={(e) => setForm((f) => ({ ...f, contractDate: e.target.value }))}
                  className="rounded-2xl border-slate-200"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">예상 납기</Label>
              <Input
                type="date"
                value={form.expectedDeliveryDate}
                onChange={(e) => setForm((f) => ({ ...f, expectedDeliveryDate: e.target.value }))}
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

      {/* Delivery Dialog */}
      <Dialog
        open={showDeliveryForm}
        onOpenChange={(o) => {
          setShowDeliveryForm(o);
          if (!o) {
            setSelectedOrder(null);
            setDeliveryForm({
              revenueAmount: "",
              deliveryStatus: "pending",
              deliveredAt: "",
              billingStatus: "unbilled",
              notes: "",
            });
          }
        }}
      >
        <DialogContent className="rounded-3xl border border-slate-100 bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-black">납품 생성</DialogTitle>
            {selectedOrder && (
              <p className="mt-2 text-sm text-slate-600">
                고객사: <span className="font-bold text-slate-900">{selectedOrder.clientName}</span>
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleCreateDelivery} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">수익 금액(원) *</Label>
              <Input
                type="number"
                value={deliveryForm.revenueAmount}
                onChange={(e) => setDeliveryForm((f) => ({ ...f, revenueAmount: e.target.value }))}
                required
                className="rounded-2xl border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">납품 상태</Label>
                <select
                  value={deliveryForm.deliveryStatus}
                  onChange={(e) => setDeliveryForm((f) => ({ ...f, deliveryStatus: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="pending">대기</option>
                  <option value="delivered">완료</option>
                  <option value="invoiced">청구</option>
                  <option value="paid">수금</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">청구 상태</Label>
                <select
                  value={deliveryForm.billingStatus}
                  onChange={(e) => setDeliveryForm((f) => ({ ...f, billingStatus: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="unbilled">미청구</option>
                  <option value="billed">청구</option>
                  <option value="paid">수금</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">납품일</Label>
              <Input
                type="date"
                value={deliveryForm.deliveredAt}
                onChange={(e) => setDeliveryForm((f) => ({ ...f, deliveredAt: e.target.value }))}
                className="rounded-2xl border-slate-200"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">메모</Label>
              <Textarea
                value={deliveryForm.notes}
                onChange={(e) => setDeliveryForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="rounded-2xl border-slate-200 resize-none"
                placeholder="선택 입력"
              />
            </div>

            <Button
              type="submit"
              disabled={createDeliveryMutation.isPending}
              className="w-full rounded-2xl text-white font-bold"
              style={{
                background: "rgb(37, 99, 235)",
                boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
              }}
            >
              {createDeliveryMutation.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              납품 생성
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">수주를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              <span className="font-semibold text-slate-900">{confirm?.title}</span>
              {" "}항목을 삭제하면 복구할 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">아니요</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl"
              onClick={async () => {
                if (!confirm) return;
                await handleDelete(confirm.id);
                setConfirm(null);
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
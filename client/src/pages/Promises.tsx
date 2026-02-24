import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePromiseAlerts } from "@/hooks/usePromiseAlerts";
import {
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ShoppingCart,
  X,
  Edit2,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import ClientNameInput from "@/components/ClientNameInput";

// ✅ 추가 (shadcn)
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

type PromiseStatus = "scheduled" | "completed" | "canceled" | "overdue";
type EffectiveStatus = PromiseStatus | "imminent";
type TabKey = PromiseStatus | "all" | "imminent";

const statusTabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "imminent", label: "임박" },
  { key: "scheduled", label: "예정" },
  { key: "completed", label: "완료" },
  { key: "overdue", label: "지연" },
  { key: "canceled", label: "취소" },
];

export default function Promises() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    clientName: "",
    clientId: undefined as number | undefined,
    title: "",
    description: "",
    scheduledAt: "",
  });

  const [selectedPromise, setSelectedPromise] = useState<any>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({
    productService: "",
    amount: "",
    status: "proposal" as const,
    contractDate: "",
    notes: "",
  });

  // ✅ 더보기 액션 확인 다이얼로그 상태
  const [confirm, setConfirm] = useState<null | {
    type: "delete" | "cancel";
    id: number;
    title: string;
  }>(null);

  // "임박" 탭은 서버에 "scheduled"로 조회 후 클라이언트에서 필터
  const queryStatus: PromiseStatus | undefined =
    activeTab === "all" || activeTab === "imminent" ? undefined : activeTab;
  const { data: promises, isLoading } = trpc.promises.list.useQuery(
    queryStatus ? { status: queryStatus } : undefined
  );

  const createMutation = trpc.promises.create.useMutation();
  const updateMutation = trpc.promises.update.useMutation();
  const deleteMutation = trpc.promises.delete.useMutation();
  const completeMutation = trpc.promises.complete.useMutation();
  const cancelMutation = trpc.promises.cancel.useMutation();
  const createOrderMutation = trpc.orders.create.useMutation();
  const utils = trpc.useUtils();

  const list = useMemo(() => {
    const nowMs = Date.now();
    // KST 기준 오늘 자정(00:00 KST)을 UTC ms로 계산
    const kstNow = new Date(nowMs + 9 * 60 * 60 * 1000);
    const kstTodayMidnightMs = new Date(kstNow.toISOString().slice(0, 10) + "T00:00:00+09:00").getTime();

    const rows = promises ?? [];
    return rows.map((p) => {
      const scheduledMs = new Date(p.scheduledAt).getTime();
      // 지연: KST 기준 오늘 날짜보다 이전 날의 일정만
      const overdue = p.status === "scheduled" && scheduledMs < kstTodayMidnightMs;
      // 임박: 미래이고 12시간 이내
      const imminent = p.status === "scheduled" && !overdue && scheduledMs > nowMs && scheduledMs - nowMs <= 12 * 60 * 60 * 1000;
      const effectiveStatus: EffectiveStatus = overdue ? "overdue" : imminent ? "imminent" : p.status;
      return { ...p, overdue, imminent, effectiveStatus };
    });
  }, [promises]);

  // 탭별 표시 목록: 전체=지연→임박→나머지 정렬, 임박=임박만 필터
  const displayList = useMemo(() => {
    if (activeTab === "imminent") return list.filter((p) => p.imminent);
    if (activeTab === "all") {
      return [...list].sort((a, b) => {
        const rank = (p: typeof a) => (p.overdue ? 0 : p.imminent ? 1 : 2);
        return rank(a) - rank(b);
      });
    }
    return list;
  }, [list, activeTab]);

  // 알림: 지연·임박 일정이 있으면 브라우저 알림 (세션 당 1회)
  const overdueInList = list.filter((p) => p.overdue).length;
  const imminentInList = list.filter((p) => p.imminent).length;
  usePromiseAlerts(overdueInList, imminentInList);

  const resetForm = () => {
    setEditingId(null);
    setForm({ clientName: "", clientId: undefined, title: "", description: "", scheduledAt: "" });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) {
      toast.error("제목과 일시를 입력해주세요.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        clientId: form.clientId,
        clientName: form.clientName || undefined,
        title: form.title,
        description: form.description || undefined,
        scheduledAt: form.scheduledAt,
      });
      utils.promises.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("일정이 등록되었습니다.");
      setShowForm(false);
      resetForm();
    } catch {
      toast.error("등록에 실패했습니다.");
    }
  };

  const handleEdit = (promise: any) => {
    setEditingId(promise.id);
    setForm({
      clientName: promise.clientName || "",
      clientId: promise.clientId ?? undefined,
      title: promise.title,
      description: promise.description || "",
      scheduledAt: new Date(promise.scheduledAt).toISOString().slice(0, 16),
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!form.title || !form.scheduledAt) {
      toast.error("제목과 일시를 입력해주세요.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        title: form.title,
        clientName: form.clientName || undefined,
        description: form.description || undefined,
        scheduledAt: form.scheduledAt,
      });
      utils.promises.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("일정이 수정되었습니다.");
      setShowForm(false);
      resetForm();
    } catch {
      toast.error("수정에 실패했습니다.");
    }
  };

  // ✅ confirm() 제거: AlertDialog에서만 확인
  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      utils.promises.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync({ id });
      utils.promises.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("완료 처리되었습니다.");
    } catch {
      toast.error("처리에 실패했습니다.");
    }
  };

  // ✅ confirm() 제거: AlertDialog에서만 확인
  const handleCancel = async (id: number) => {
    try {
      await cancelMutation.mutateAsync({ id });
      utils.promises.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("취소되었습니다.");
    } catch {
      toast.error("처리에 실패했습니다.");
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromise || !orderForm.productService || !orderForm.amount) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    try {
      await createOrderMutation.mutateAsync({
        clientName: selectedPromise.clientName || "",
        productService: orderForm.productService,
        amount: Number(orderForm.amount),
        status: orderForm.status,
        contractDate: orderForm.contractDate || undefined,
        notes: orderForm.notes || undefined,
      });

      utils.orders.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("수주가 생성되었습니다.");

      setShowOrderForm(false);
      setSelectedPromise(null);
      setOrderForm({ productService: "", amount: "", status: "proposal", contractDate: "", notes: "" });

      if (selectedPromise?.id) {
        await completeMutation.mutateAsync({ id: selectedPromise.id });
        utils.promises.list.invalidate();
      }
    } catch {
      toast.error("수주 생성에 실패했습니다.");
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
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
              SCHEDULE
            </p>
            <h1 className="text-base sm:text-lg font-black text-slate-900">
              일정 관리
            </h1>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-bold text-white transition"
            style={{
              background: "rgb(37, 99, 235)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
            }}
          >
            <Plus size={16} />
            일정 추가
          </button>
        </div>

        {/* Tabs */}
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
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-100 bg-white p-4 h-20 animate-pulse"
            />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-16">
          <Calendar
            size={40}
            className="mx-auto mb-4 opacity-20 text-blue-600"
          />
          <p className="text-base font-bold text-slate-800">일정이 없습니다</p>
          <p className="text-sm mt-1 text-slate-500">
            영업일지 AI 분석 시 자동으로 등록됩니다
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map((p: any) => (
            <div
              key={p.id}
              className="rounded-3xl border border-slate-100 bg-white p-4 hover:shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition"
              style={
                p.overdue
                  ? { borderColor: "rgba(239,68,68,0.20)" }
                  : p.imminent
                  ? { borderColor: "rgba(249,115,22,0.22)" }
                  : {}
              }
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
                  style={
                    p.overdue
                      ? {
                          background: "rgba(239,68,68,0.08)",
                          borderColor: "rgba(239,68,68,0.18)",
                          color: "rgb(239,68,68)",
                        }
                      : p.imminent
                      ? {
                          background: "rgba(249,115,22,0.08)",
                          borderColor: "rgba(249,115,22,0.20)",
                          color: "rgb(234,88,12)",
                        }
                      : {
                          background: "rgba(37,99,235,0.08)",
                          borderColor: "rgba(37,99,235,0.14)",
                          color: "rgb(37,99,235)",
                        }
                  }
                >
                  <Calendar size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-slate-900">{p.title}</p>
                    <StatusBadge status={p.effectiveStatus} />
                    {p.isAutoGenerated && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
                        style={{
                          background: "rgba(124,58,237,0.08)",
                          color: "rgb(124,58,237)",
                          borderColor: "rgba(124,58,237,0.18)",
                        }}
                      >
                        AI
                      </span>
                    )}
                  </div>

                  {p.clientName && (
                    <p className="text-xs text-slate-500 mt-1">{p.clientName}</p>
                  )}
                  {p.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  <p
                    className="text-xs mt-2 font-semibold flex items-center gap-1"
                    style={
                      p.overdue
                        ? { color: "rgb(239,68,68)" }
                        : p.imminent
                        ? { color: "rgb(234,88,12)" }
                        : { color: "rgb(37,99,235)" }
                    }
                  >
                    <Clock size={12} />
                    {new Date(p.scheduledAt).toLocaleString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Actions (토스식: 주요 액션 + 더보기) */}
                <div className="flex items-center gap-1 shrink-0">
                  {p.status === "scheduled" && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedPromise(p);
                          setOrderForm({
                            productService: "",
                            amount: p.amount ? String(Math.round(Number(p.amount))) : "",
                            status: "proposal",
                            contractDate: new Date(p.scheduledAt).toISOString().split("T")[0],
                            notes: p.description || "",
                          });
                          setShowOrderForm(true);
                        }}
                        className="w-9 h-9 rounded-2xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center"
                        title="수주 생성"
                      >
                        <ShoppingCart size={16} className="text-slate-700" />
                      </button>

                      <button
                        onClick={() => handleComplete(p.id)}
                        disabled={completeMutation.isPending}
                        className="w-9 h-9 rounded-2xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center disabled:opacity-50"
                        title="완료"
                      >
                        <CheckCircle size={16} className="text-emerald-600" />
                      </button>
                    </>
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
                        onClick={() => handleEdit(p)}
                        className="rounded-xl flex items-center gap-2"
                      >
                        <Edit2 size={14} className="text-slate-700" />
                        수정
                      </DropdownMenuItem>

                      {p.status === "scheduled" && (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirm({
                              type: "cancel",
                              id: p.id,
                              title: p.title,
                            })
                          }
                          className="rounded-xl flex items-center gap-2"
                        >
                          <XCircle size={14} className="text-slate-700" />
                          취소 처리
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() =>
                          setConfirm({
                            type: "delete",
                            id: p.id,
                            title: p.title,
                          })
                        }
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
              {editingId ? "일정 수정" : "일정 추가"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={editingId ? handleUpdate : handleCreate}
            className="space-y-4"
          >
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                고객사 (선택)
              </Label>
              <ClientNameInput
                value={form.clientName}
                clientId={form.clientId}
                onChange={(name, id) => setForm((f) => ({ ...f, clientName: name, clientId: id }))}
                placeholder="(주)삼성전자"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                일정 내용 *
              </Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="제안서 발표 미팅"
                required
                className="rounded-2xl border-slate-200"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                일시 *
              </Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scheduledAt: e.target.value }))
                }
                required
                className="rounded-2xl border-slate-200"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                메모 (선택)
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="일정 관련 메모"
                rows={3}
                className="rounded-2xl border-slate-200 resize-none"
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

      {/* Create Order Dialog */}
      <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
        <DialogContent className="rounded-3xl border border-slate-100 bg-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-slate-900 font-black">
                수주 생성
              </DialogTitle>

            </div>
            {selectedPromise && (
              <p className="text-sm mt-2 text-slate-600">
                일정:{" "}
                <span className="text-slate-900 font-bold">
                  {selectedPromise.title}
                </span>
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleCreateOrder} className="space-y-4">
            {selectedPromise?.clientName && (
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                  고객사
                </Label>
                <div className="px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900">
                  {selectedPromise.clientName}
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                상품/서비스 *
              </Label>
              <Input
                value={orderForm.productService}
                onChange={(e) =>
                  setOrderForm((f) => ({
                    ...f,
                    productService: e.target.value,
                  }))
                }
                required
                placeholder="예: 소프트웨어 개발"
                className="rounded-2xl border-slate-200"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                예상 금액 (원) *
              </Label>
              <Input
                type="number"
                value={orderForm.amount}
                onChange={(e) =>
                  setOrderForm((f) => ({ ...f, amount: e.target.value }))
                }
                required
                placeholder="5000000"
                className="rounded-2xl border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                  초기 상태
                </Label>
                <select
                  value={orderForm.status}
                  onChange={(e: any) =>
                    setOrderForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="proposal">제안</option>
                  <option value="negotiation">협상</option>
                  <option value="confirmed">확정</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                  계약일
                </Label>
                <Input
                  type="date"
                  value={orderForm.contractDate}
                  onChange={(e) =>
                    setOrderForm((f) => ({ ...f, contractDate: e.target.value }))
                  }
                  className="rounded-2xl border-slate-200"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                메모
              </Label>
              <Textarea
                value={orderForm.notes}
                onChange={(e) =>
                  setOrderForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                className="rounded-2xl border-slate-200 resize-none"
                placeholder="일정 메모에서 자동 입력"
              />
            </div>

            <Button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="w-full rounded-2xl text-white font-bold"
              style={{
                background: "rgb(37, 99, 235)",
                boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
              }}
            >
              {createOrderMutation.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              수주 생성
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ✅ Confirm AlertDialog */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">
              {confirm?.type === "delete"
                ? "일정을 삭제할까요?"
                : "일정을 취소 처리할까요?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              <span className="font-semibold text-slate-900">
                {confirm?.title}
              </span>
              {confirm?.type === "delete"
                ? " 을(를) 삭제하면 복구할 수 없어요."
                : " 을(를) 취소 상태로 변경합니다."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">
              아니요
            </AlertDialogCancel>

            <AlertDialogAction
              className="rounded-2xl"
              onClick={async () => {
                if (!confirm) return;
                if (confirm.type === "delete") await handleDelete(confirm.id);
                if (confirm.type === "cancel") await handleCancel(confirm.id);
                setConfirm(null);
              }}
              style={{
                background:
                  confirm?.type === "delete"
                    ? "rgb(239,68,68)"
                    : "rgb(37,99,235)",
              }}
            >
              {confirm?.type === "delete" ? "삭제" : "취소 처리"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
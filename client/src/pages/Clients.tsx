"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Plus, Users, Search, ChevronRight, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function getInitial(name: string) {
  const t = (name || "").trim();
  return t ? t[0] : "C";
}

function chip(active: boolean) {
  return active
    ? {
        background: "rgba(37,99,235,0.10)",
        borderColor: "rgba(37,99,235,0.25)",
        color: "rgb(37,99,235)",
      }
    : {
        background: "white",
        borderColor: "rgba(15,23,42,0.08)",
        color: "rgb(100,116,139)",
      };
}

export default function Clients() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
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
      utils.clients.list.invalidate();
      toast.success("고객사가 등록되었습니다.");
      setShowForm(false);
      resetForm();
    } catch {
      toast.error("등록에 실패했습니다.");
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* ✅ Toss-style sticky header */}
      <div
        className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 pt-3 pb-4 border-b mb-4"
        style={{
          background: "rgba(255,255,255,0.86)",
          borderColor: "rgba(15,23,42,0.08)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
              CLIENTS
            </p>
            <h1 className="text-base sm:text-lg font-black text-slate-900">고객사 관리</h1>
            <p className="mt-1 text-sm text-slate-500">고객사/담당자 정보를 빠르게 찾아요.</p>
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
            고객사 추가
          </button>
        </div>

        {/* ✅ Search */}
        <div className="mt-3 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          {!!search.trim() && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center"
              aria-label="검색어 지우기"
            >
              <X size={14} className="text-slate-600" />
            </button>
          )}
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="고객사명, 담당자로 검색…"
            className="pl-9 pr-10 py-3 text-sm rounded-2xl border border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-200"
          />
        </div>

        {/* ✅ tiny status row */}
        <div className="mt-3 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
            style={chip(true)}
          >
            전체 <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-600 text-white">{filteredCount}</span>
          </span>
          {!!search.trim() && (
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
              style={chip(false)}
            >
              검색중
            </span>
          )}
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
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (clients?.length ?? 0) === 0 ? (
        <div className="text-center py-14">
          <div className="mx-auto w-14 h-14 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Users size={26} className="text-blue-600" />
          </div>
          <p className="mt-4 text-base font-black text-slate-900">고객사가 없습니다</p>
          <p className="mt-1 text-sm text-slate-500">첫 번째 고객사를 등록해보세요.</p>
          <div className="mt-5 flex justify-center">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: "rgb(37, 99, 235)" }}
            >
              <Plus size={16} />
              고객사 등록하기
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {clients?.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <div
                className={[
                  "group rounded-3xl border border-slate-100 bg-white p-4 transition cursor-pointer",
                  "hover:shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:border-blue-100",
                  "focus-within:ring-2 focus-within:ring-blue-200",
                ].join(" ")}
                style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-blue-600">
                      {getInitial(client.name)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-slate-900 text-sm truncate">{client.name}</p>
                      {client.industry && (
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            background: "rgba(37,99,235,0.08)",
                            borderColor: "rgba(37,99,235,0.18)",
                            color: "rgb(37,99,235)",
                          }}
                        >
                          {client.industry}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {client.contactPerson && <span>담당: {client.contactPerson}</span>}
                      {client.contactPhone && <span className="font-semibold">{client.contactPhone}</span>}
                      {client.contactEmail && <span className="truncate">{client.contactEmail}</span>}
                    </div>

                    {client.address && (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-1">📍 {client.address}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center transition group-hover:bg-blue-50 group-hover:border-blue-100">
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        className="fixed bottom-20 right-5 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-[0_12px_28px_rgba(37,99,235,0.30)] lg:hidden"
        style={{ background: "rgb(37, 99, 235)" }}
        onClick={openCreate}
        aria-label="고객사 추가"
      >
        <Plus size={24} />
      </button>

      {/* Create Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(o) => {
          setShowForm(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="rounded-3xl border border-slate-100 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-black">고객사 등록</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">고객사명 *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="(주)삼성전자"
                className="rounded-2xl border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">업종</Label>
                <Input
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  placeholder="제조업"
                  className="rounded-2xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">담당자</Label>
                <Input
                  value={form.contactPerson}
                  onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                  placeholder="홍길동 부장"
                  className="rounded-2xl border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">연락처</Label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="010-1234-5678"
                  className="rounded-2xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">이메일</Label>
                <Input
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="hong@samsung.com"
                  className="rounded-2xl border-slate-200"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">주소</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="서울 강남구 테헤란로 123"
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
              disabled={createMutation.isPending}
              className="w-full rounded-2xl text-white font-bold"
              style={{
                background: "rgb(37, 99, 235)",
                boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
              }}
            >
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              등록
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
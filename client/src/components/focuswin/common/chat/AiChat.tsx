// client/src/components/focuswin/common/chat/AiChat.tsx

import { Bot, GripHorizontal, Send, Sparkles, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatVM } from "@/hooks/focuswin/chat/useChatVM";

const SUGGESTIONS = [
  "이번 달 영업 현황 알려줘",
  "다가오는 일정 뭐 있어?",
  "이번 달 지출 얼마야?",
];

const MIN_W = 320;
const MIN_H = 480;
const MAX_W = 760;
const MAX_H = 900;

export default function AiChat() {
  const vm = useChatVM();
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [size, setSize] = useState({ w: 360, h: 560 });
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dw = dragRef.current.startX - ev.clientX; // 왼쪽 드래그 = 넓어짐
      const dh = dragRef.current.startY - ev.clientY; // 위로 드래그 = 높아짐
      setSize({
        w: Math.min(MAX_W, Math.max(MIN_W, dragRef.current.startW + dw)),
        h: Math.min(MAX_H, Math.max(MIN_H, dragRef.current.startH + dh)),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [size]);

  const drawerStyle = isDesktop
    ? { width: size.w, height: size.h, boxShadow: "0 16px 48px rgba(15,23,42,0.14)" }
    : { boxShadow: "0 16px 48px rgba(15,23,42,0.14)" };

  return (
    <>
      {/* Floating Button */}
      {!vm.open && (
        <button
          onClick={() => vm.setOpen(true)}
          className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-4 lg:bottom-6 lg:left-auto lg:right-6 z-50
            w-12 h-12 rounded-2xl flex items-center justify-center
            text-white transition hover:scale-105 active:scale-95"
          style={{ background: "rgb(37,99,235)", boxShadow: "0 8px 24px rgba(37,99,235,0.35)" }}
          aria-label="AI 어시스턴트 열기"
        >
          <Sparkles size={20} />
        </button>
      )}

      {/* Drawer */}
      {vm.open && (
        <>
          {/* Backdrop (mobile only) */}
          <div
            className="lg:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px]"
            onClick={() => vm.setOpen(false)}
          />

          <div
            className="fixed z-50
              bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 h-[65dvh]
              lg:bottom-6 lg:left-auto lg:right-6
              flex flex-col rounded-t-3xl lg:rounded-3xl
              bg-white border border-slate-100 overflow-hidden select-none"
            style={drawerStyle}
          >
            {/* PC 전용 resize handle — 좌상단 모서리 드래그 */}
            {isDesktop && (
              <div
                className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-10 flex items-center justify-center group"
                onMouseDown={onResizeStart}
              >
                <GripHorizontal size={10} className="text-slate-200 group-hover:text-slate-400 rotate-45 transition" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center ring-1 ring-blue-100">
                <Bot size={15} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">AI 어시스턴트</p>
                <p className="text-[11px] text-slate-400">영업 데이터를 물어보세요</p>
              </div>
              <button
                onClick={() => vm.clear()}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                aria-label="대화 초기화"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => vm.setOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {vm.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center ring-1 ring-blue-100">
                    <Sparkles size={20} className="text-blue-500" />
                  </div>
                  <p className="text-sm text-slate-500 text-center">
                    영업일지, 지출, 일정 등<br />궁금한 걸 물어보세요
                  </p>
                  <div className="flex flex-col gap-2 w-full">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => { vm.setInput(s); }}
                        className="text-left text-[13px] px-3 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition border border-slate-100"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {vm.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {vm.isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={vm.bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-100 shrink-0">
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition">
                <textarea
                  value={vm.input}
                  onChange={e => vm.setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void vm.send();
                    }
                  }}
                  placeholder="메시지 입력..."
                  rows={1}
                  className="flex-1 resize-none text-[13px] text-slate-800 placeholder:text-slate-400 outline-none bg-transparent leading-relaxed max-h-24 overflow-y-auto"
                  style={{ scrollbarWidth: "none" }}
                />
                <button
                  onClick={() => void vm.send()}
                  disabled={!vm.input.trim() || vm.isLoading}
                  className="w-7 h-7 rounded-xl flex items-center justify-center transition shrink-0
                    disabled:opacity-30 disabled:cursor-not-allowed
                    bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

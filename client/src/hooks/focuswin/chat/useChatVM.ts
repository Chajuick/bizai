// client/src/hooks/focuswin/chat/useChatVM.ts

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function useChatVM() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMut = trpc.ai.chat.send.useMutation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sendMut.isPending) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput("");

    try {
      const result = await sendMut.mutateAsync({
        messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
      });

      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: result.reply },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: `오류: ${msg}` },
      ]);
    }
  };

  const clear = () => setMessages([]);

  return {
    open,
    setOpen,
    messages,
    input,
    setInput,
    send,
    clear,
    isLoading: sendMut.isPending,
    bottomRef,
  };
}

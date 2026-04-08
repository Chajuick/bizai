// server/modules/ai/chat/chat.dto.ts

import { z } from "zod";

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const ChatSendInput = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(30),
});

export const ChatSendOutput = z.object({
  reply: z.string(),
});

export type ChatMessageType = z.infer<typeof ChatMessageSchema>;

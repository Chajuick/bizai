// server/modules/ai/chat/chat.router.ts

import { protectedProcedure, router } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";
import { ChatSendInput, ChatSendOutput } from "./chat.dto";
import { chatService } from "./chat.service";

export const chatRouter = router({
  send: protectedProcedure
    .input(ChatSendInput)
    .output(ChatSendOutput)
    .mutation(({ ctx, input }) =>
      chatService.send(svcCtxFromTrpc(ctx), input.messages).then(reply => ({ reply }))
    ),
});

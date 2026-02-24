import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { createAttachment } from "../db";
import { nanoid } from "nanoid";

export const uploadRouter = router({
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        mimeType: z.string(),
        salesLogId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 파일 키 생성 (랜덤 suffix로 열거 방지)
      const ext = input.fileName.split(".").pop() || "bin";
      const fileKey = `user-${ctx.user.id}/attachments/${nanoid()}.${ext}`;
      return { fileKey, uploadReady: true };
    }),

  confirmUpload: protectedProcedure
    .input(
      z.object({
        salesLogId: z.number().optional(),
        fileName: z.string(),
        fileKey: z.string(),
        fileUrl: z.string(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createAttachment({
        userId: ctx.user.id,
        salesLogId: input.salesLogId,
        fileName: input.fileName,
        fileKey: input.fileKey,
        fileUrl: input.fileUrl,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
      })
    ),
});

// server/modules/crm/file/file.router.ts

// #region Imports
import { router, protectedProcedure } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";

import {
  PrepareUploadInput,
  PrepareUploadOutput,
  ConfirmUploadInput,
  ConfirmUploadOutput,
  ListByRefInput,
  ListByRefOutput,
  TranscribeFileInput,
  TranscribeFileOutput,
} from "./file.dto";

import { fileService } from "./file.service";
// #endregion

// #region Router
export const fileRouter = router({
  // #region prepareUpload
  prepareUpload: protectedProcedure
    .input(PrepareUploadInput)
    .output(PrepareUploadOutput)
    .mutation(({ ctx, input }) => fileService.prepareUpload(svcCtxFromTrpc(ctx), input)),
  // #endregion

  // #region confirmUpload
  confirmUpload: protectedProcedure
    .input(ConfirmUploadInput)
    .output(ConfirmUploadOutput)
    .mutation(({ ctx, input }) => fileService.confirmUpload(svcCtxFromTrpc(ctx), input)),
  // #endregion

  // #region listByRef
  listByRef: protectedProcedure
    .input(ListByRefInput)
    .output(ListByRefOutput)
    .query(({ ctx, input }) => fileService.listByRef(svcCtxFromTrpc(ctx), input)),
  // #endregion

  // #region transcribeFile
  transcribeFile: protectedProcedure
    .input(TranscribeFileInput)
    .output(TranscribeFileOutput)
    .mutation(({ ctx, input }) => fileService.transcribeFile(svcCtxFromTrpc(ctx), input)),
  // #endregion
});
// #endregion
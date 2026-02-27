// server/modules/crm/schedule/schedule.router.ts

// #region Imports
import { protectedProcedure, router } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";

import {
  ScheduleCreateInput,
  ScheduleDeleteInput,
  ScheduleIdInput,
  ScheduleListInput,
  ScheduleListOutput,
  ScheduleUpdateInput,
} from "./schedule.dto";

import { scheduleService } from "./schedule.service";
// #endregion

// #region Router
export const scheduleRouter = router({
  // #region list
  list: protectedProcedure
    .input(ScheduleListInput)
    .output(ScheduleListOutput)
    .query(({ ctx, input }) => scheduleService.listSchedules(svcCtxFromTrpc(ctx), input ?? undefined)),
  // #endregion

  // #region get
  get: protectedProcedure
    .input(ScheduleIdInput)
    .query(({ ctx, input }) => scheduleService.getSchedule(svcCtxFromTrpc(ctx), input.sche_idno)),
  // #endregion

  // #region create
  create: protectedProcedure
    .input(ScheduleCreateInput)
    .mutation(({ ctx, input }) => scheduleService.createSchedule(svcCtxFromTrpc(ctx), input)),
  // #endregion

  // #region update
  update: protectedProcedure
    .input(ScheduleUpdateInput)
    .mutation(({ ctx, input }) => {
      const { sche_idno, ...patch } = input;
      return scheduleService.updateSchedule(svcCtxFromTrpc(ctx), sche_idno, patch);
    }),
  // #endregion

  // #region complete
  complete: protectedProcedure
    .input(ScheduleIdInput)
    .mutation(({ ctx, input }) => scheduleService.completeSchedule(svcCtxFromTrpc(ctx), input.sche_idno)),
  // #endregion

  // #region cancel
  cancel: protectedProcedure
    .input(ScheduleIdInput)
    .mutation(({ ctx, input }) => scheduleService.cancelSchedule(svcCtxFromTrpc(ctx), input.sche_idno)),
  // #endregion

  // #region delete (soft-disable)
  delete: protectedProcedure
    .input(ScheduleDeleteInput)
    .mutation(({ ctx, input }) => scheduleService.disableSchedule(svcCtxFromTrpc(ctx), input.sche_idno)),
  // #endregion
});
// #endregion
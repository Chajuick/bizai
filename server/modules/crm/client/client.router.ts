// server/modules/crm/client/client.router.ts

// #region Imports
import { z } from "zod";
import { protectedProcedure, router } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";

import {
  ClientContactCreateInput,
  ClientContactDeleteInput,
  ClientContactItemOutput,
  ClientContactListInput,
  ClientContactListOutput,
  ClientContactUpdateInput,
  ClientCreateInput,
  ClientCreateOutput,
  ClientDeleteInput,
  ClientFindNameInput,
  ClientIdInput,
  ClientListInput,
  ClientListOutput,
  ClientMatchOutput,
  ClientItemOutput,
  ClientSyncContactInput,
  ClientSyncContactsInput,
  ClientUpdateInput,
} from "./client.dto";

import { clientService } from "./client.service";
// #endregion

// #region Router
export const clientRouter = router({
  // #region list
  list: protectedProcedure
    .input(ClientListInput)
    .output(ClientListOutput)
    .query(({ ctx, input }) => clientService.listClients(svcCtxFromTrpc(ctx), input)),
  // #endregion

  // #region findBestMatch
  findBestMatch: protectedProcedure
    .input(ClientFindNameInput)
    .output(ClientMatchOutput.nullable())
    .query(({ ctx, input }) =>
      clientService.findBestClientMatch(svcCtxFromTrpc(ctx), { name: input.name })
    ),
  // #endregion

  // #region findOrCreate
  findOrCreate: protectedProcedure
    .input(ClientFindNameInput)
    .output(ClientItemOutput.nullable())
    .mutation(({ ctx, input }) =>
      clientService.findOrCreateClient(svcCtxFromTrpc(ctx), { clie_name: input.name })
    ),
  // #endregion

  // #region get
  get: protectedProcedure
    .input(ClientIdInput)
    .output(ClientItemOutput.nullable())
    .query(({ ctx, input }) =>
      clientService.getClient(svcCtxFromTrpc(ctx), input.clie_idno)
    ),
  // #endregion

  // #region create
  create: protectedProcedure
    .input(ClientCreateInput)
    .output(ClientCreateOutput)
    .mutation(({ ctx, input }) =>
      clientService.createClient(svcCtxFromTrpc(ctx), input)
    ),
  // #endregion

  // #region update
  update: protectedProcedure
    .input(ClientUpdateInput)
    .mutation(({ ctx, input }) => {
      const { clie_idno, ...patch } = input;
      return clientService.updateClient(svcCtxFromTrpc(ctx), clie_idno, patch);
    }),
  // #endregion

  // #region delete (soft disable)
  delete: protectedProcedure
    .input(ClientDeleteInput)
    .mutation(({ ctx, input }) =>
      clientService.disableClient(svcCtxFromTrpc(ctx), input.clie_idno)
    ),
  // #endregion

  // #region syncContact — AI 추출 연락처를 고객사 빈 필드에 반영 (단일)
  syncContact: protectedProcedure
    .input(ClientSyncContactInput)
    .mutation(({ ctx, input }) =>
      clientService.syncContact(svcCtxFromTrpc(ctx), input)
    ),
  // #endregion

  // #region syncContacts — AI 추출 복수 담당자 upsert
  syncContacts: protectedProcedure
    .input(ClientSyncContactsInput)
    .mutation(({ ctx, input }) =>
      clientService.syncContacts(svcCtxFromTrpc(ctx), input)
    ),
  // #endregion

  // #region contact (nested router)
  contact: router({
    // 담당자 목록
    list: protectedProcedure
      .input(ClientContactListInput)
      .output(ClientContactListOutput)
      .query(({ ctx, input }) =>
        clientService.listContacts(svcCtxFromTrpc(ctx), input.clie_idno)
      ),

    // 담당자 등록
    create: protectedProcedure
      .input(ClientContactCreateInput)
      .output(z.object({ cont_idno: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        clientService.createContact(svcCtxFromTrpc(ctx), input)
      ),

    // 담당자 수정
    update: protectedProcedure
      .input(ClientContactUpdateInput)
      .output(z.object({ success: z.literal(true) }))
      .mutation(({ ctx, input }) =>
        clientService.updateContact(svcCtxFromTrpc(ctx), input)
      ),

    // 담당자 삭제 (soft)
    delete: protectedProcedure
      .input(ClientContactDeleteInput)
      .output(z.object({ success: z.literal(true) }))
      .mutation(({ ctx, input }) =>
        clientService.deleteContact(svcCtxFromTrpc(ctx), input.cont_idno)
      ),
  }),
  // #endregion
});
// #endregion
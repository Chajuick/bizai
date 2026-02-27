// server/modules/crm/client/client.router.ts

// #region Imports
import { protectedProcedure, router } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";

import {
  ClientCreateInput,
  ClientCreateOutput,
  ClientDeleteInput,
  ClientFindNameInput,
  ClientIdInput,
  ClientListInput,
  ClientListOutput,
  ClientMatchOutput,
  ClientItemOutput,
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
});
// #endregion
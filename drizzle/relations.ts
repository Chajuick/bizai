import { relations } from "drizzle-orm";
import { CRM_CLIENT, CRM_CLIENT_CONT } from "./schema";

export const CRM_CLIENT_REL = relations(CRM_CLIENT, ({ many }) => ({
  contacts: many(CRM_CLIENT_CONT),
}));

export const CRM_CLIENT_CONT_REL = relations(CRM_CLIENT_CONT, ({ one }) => ({
  client: one(CRM_CLIENT, {
    fields: [CRM_CLIENT_CONT.clie_idno],
    references: [CRM_CLIENT.clie_idno],
  }),
}));
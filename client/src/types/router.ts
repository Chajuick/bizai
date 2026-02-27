import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/core/trpc/appRouters";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

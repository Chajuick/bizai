import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/core/trpc/appRouters";

export const trpc = createTRPCReact<AppRouter>();

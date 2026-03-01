import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        const compId = localStorage.getItem("active_comp_id");
        return compId ? { "x-comp-id": compId } : {};
      },
      fetch(input, init) {
        return fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});
import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import { trpc } from "@/lib/trpc";
import { trpcClient } from "@/lib/trpcClient";
import { queryClient } from "@/lib/queryClient";
import '@/index.css';

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
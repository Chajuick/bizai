import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

export function useWorkspaceSwitcher() {
  const utils = trpc.useUtils();

  const { data: context } = trpc.company.getMyCompanyContext.useQuery(undefined, {
    staleTime: 30_000,
  });

  const { data: companies = [] } = trpc.company.getMyCompanies.useQuery(undefined, {
    staleTime: 60_000,
  });

  const { data: billing } = trpc.billing.getSummary.useQuery(undefined, {
    staleTime: 60_000,
  });

  const switchCompany = useCallback(
    async (compIdno: number) => {
      localStorage.setItem("active_comp_id", String(compIdno));
      await utils.invalidate();
    },
    [utils],
  );

  return {
    currentCompIdno: context?.comp_idno ?? null,
    currentCompName: context?.comp_name ?? null,
    companyRole: context?.company_role ?? null,
    planCode: billing?.plan_code ?? null,
    planName: billing?.plan_name ?? null,
    companies,
    switchCompany,
  };
}

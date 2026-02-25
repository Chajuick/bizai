import React from "react";
import PageShell from "@/components/focuswin/common/page-shell";
import PageHeader from "@/components/focuswin/page-header";
import EmptyState from "@/components/focuswin/empty-state";
import SkeletonCardList from "@/components/focuswin/skeleton-card-list";

type Action =
  | { label: string; icon?: React.ReactNode; onClick: () => void }
  | { label: string; icon?: React.ReactNode; href: string };

export default function PageScaffold({
  kicker,
  title,
  description,
  action,
  headerChildren,
  notice,
  isLoading,
  hasData,
  skeleton,
  empty,
  list,
  fab,
}: {
  kicker: string;
  title: string;
  description?: string;
  action?: Action;
  headerChildren?: React.ReactNode;

  notice?: React.ReactNode;

  isLoading: boolean;
  hasData: boolean;

  skeleton?: React.ReactNode;
  empty: React.ComponentProps<typeof EmptyState>;
  list: React.ReactNode;

  fab?: React.ReactNode;
}) {
  return (
    <PageShell>
      <PageHeader kicker={kicker} title={title} description={description} primaryAction={action}>
        {headerChildren}
      </PageHeader>

      {notice}

      <div className="mt-4">
        {isLoading ? (
          skeleton ?? <SkeletonCardList count={6} variant="detailed" />
        ) : !hasData ? (
          <EmptyState {...empty} />
        ) : (
          list
        )}
      </div>

      {fab}
    </PageShell>
  );
}
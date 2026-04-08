import * as React from "react";

import PageShell from "@/components/focuswin/common/page/scaffold/page-shell";
import PageHeader, { type HeaderAction } from "@/components/focuswin/common/page/scaffold/page-header";
import SkeletonCardList from "@/components/focuswin/common/skeletons/skeleton-card-list";
import Fab from "@/components/focuswin/common/actions/fab";
import { ButtonVariant } from "@/components/focuswin/common/ui/button";
import { PageInvalidView } from "../feedback/page-invalid-view";

// #region Types

export type PageStatus = "loading" | "empty" | "ready";

export type PageFab = { label: string; icon: React.ReactNode; href: string } | { label: string; icon: React.ReactNode; onClick: () => void };

export type PageInvalidAction =
  | { label: string; onClick: () => void; icon?: React.ReactNode; variant?: ButtonVariant }
  | { label: string; href: string; icon?: React.ReactNode; variant?: ButtonVariant };

export type PageInvalidState = {
  replacePage?: boolean;
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: PageInvalidAction[];
};

export type PageScaffoldProps = {
  kicker: string;
  title: React.ReactNode;
  description?: React.ReactNode;

  onBack?: () => void;
  actions?: HeaderAction[];
  primaryAction?: HeaderAction;
  hidePrimaryActionOnMobile?: boolean;
  headerChildren?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";

  notice?: React.ReactNode;
  footer?: React.ReactNode;

  status: PageStatus;
  loading?: React.ReactNode;
  empty?: React.ReactNode;
  children: React.ReactNode;

  fab?: PageFab;

  contentClassName?: string;
  invalidState?: PageInvalidState | null;
};

// #endregion

// #region Component

export default function PageScaffold({
  kicker,
  title,
  description,
  onBack,
  actions,
  primaryAction,
  hidePrimaryActionOnMobile = false,
  headerChildren,
  notice,
  footer,
  status,
  loading,
  empty,
  children,
  fab,
  contentClassName = "mt-4",
  invalidState,
  size = "md",
}: PageScaffoldProps) {
  const showHeader = !invalidState?.replacePage;

  return (
    <PageShell size={size} outerClassName="h-full min-h-0" className="h-full min-h-0 flex flex-col overflow-hidden">
      {/* Header는 고정 */}
      {showHeader ? (
        <div className="shrink-0">
          <PageHeader kicker={kicker} title={title} description={description} onBack={onBack} actions={actions} primaryAction={primaryAction} hidePrimaryActionOnMobile={hidePrimaryActionOnMobile}>
            {headerChildren}
          </PageHeader>

          {notice ? <div className="mt-4">{notice}</div> : null}
        </div>
      ) : null}

      {/* 본문만 스크롤 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={contentClassName}>
          {status === "loading" ? (
            (loading ?? <SkeletonCardList count={6} variant="detailed" />)
          ) : invalidState ? (
            <PageInvalidView {...invalidState} />
          ) : status === "empty" ? (
            (empty ?? null)
          ) : (
            children
          )}
        </div>

        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>

      {fab ? <Fab {...fab}>{fab.icon}</Fab> : null}
    </PageShell>
  );
}

// #endregion

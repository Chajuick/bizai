import * as React from "react";

import PageShell from "@/components/focuswin/common/page-shell";
import PageHeader, { type HeaderAction } from "@/components/focuswin/common/page-header";
import SkeletonCardList from "@/components/focuswin/common/skeleton-card-list";
import Fab from "@/components/focuswin/common/fab";
import { ButtonVariant } from "./ui/button";
import { PageInvalidView } from "./page-invalid-view";

// #region Types

/** 페이지 상태 */
export type PageStatus = "loading" | "empty" | "ready";

/** Fab 액션 (Fab 컴포넌트와 동일한 계약) */
export type PageFab = { label: string; icon: React.ReactNode; href: string } | { label: string; icon: React.ReactNode; onClick: () => void };

/** 데이터 확인 안됨 상태 */
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
  // Header
  kicker: string;
  title: React.ReactNode;
  description?: React.ReactNode;

  onBack?: () => void;
  actions?: HeaderAction[];
  primaryAction?: HeaderAction;
  headerChildren?: React.ReactNode;

  // Optional blocks
  notice?: React.ReactNode;
  footer?: React.ReactNode;

  // Main content
  status: PageStatus;
  loading?: React.ReactNode;
  empty?: React.ReactNode;
  children: React.ReactNode;

  // Floating Action Button
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
}: PageScaffoldProps) {
  const showHeader = !invalidState?.replacePage;

  return (
    <PageShell>
      {/* ---------- Header ---------- */}
      {showHeader && (
        <PageHeader kicker={kicker} title={title} description={description} onBack={onBack} actions={actions} primaryAction={primaryAction}>
          {headerChildren}
        </PageHeader>
      )}

      {/* ---------- Notice ---------- */}
      {notice && showHeader ? <div className="mt-4">{notice}</div> : null}

      {/* ---------- Main Content ---------- */}
      <div className={contentClassName}>
        {status === "loading" ? (loading ?? <SkeletonCardList count={6} variant="detailed" />) : invalidState ? <PageInvalidView {...invalidState} /> : status === "empty" ? (empty ?? null) : children}
      </div>

      {/* ---------- Floating Action Button ---------- */}
      {fab ? <Fab {...fab}>{fab.icon}</Fab> : null}

      {/* ---------- Footer ---------- */}
      {footer}
    </PageShell>
  );
}

// #endregion

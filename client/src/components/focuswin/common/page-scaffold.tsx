import * as React from "react";

import PageShell from "@/components/focuswin/common/page-shell";
import PageHeader, {
  type HeaderAction,
} from "@/components/focuswin/common/page-header";
import SkeletonCardList from "@/components/focuswin/common/skeleton-card-list";
import Fab from "@/components/focuswin/common/fab";


// #region Types

/** 페이지 상태 */
export type PageStatus = "loading" | "empty" | "ready";

/** Fab 액션 (Fab 컴포넌트와 동일한 계약) */
export type PageFab =
  | { label: string; icon: React.ReactNode; href: string }
  | { label: string; icon: React.ReactNode; onClick: () => void };

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
}: PageScaffoldProps) {
  return (
    <PageShell>
      {/* ---------- Header ---------- */}
      <PageHeader
        kicker={kicker}
        title={title}
        description={description}
        onBack={onBack}
        actions={actions}
        primaryAction={primaryAction}
      >
        {headerChildren}
      </PageHeader>

      {/* ---------- Notice ---------- */}
      {notice ? <div className="mt-4">{notice}</div> : null}

      {/* ---------- Main Content ---------- */}
      <div className={contentClassName}>
        {status === "loading"
          ? loading ?? <SkeletonCardList count={6} variant="detailed" />
          : status === "empty"
            ? empty ?? null
            : children}
      </div>

      {/* ---------- Floating Action Button ---------- */}
      {fab ? (
        <Fab {...fab}>
          {fab.icon}
        </Fab>
      ) : null}

      {/* ---------- Footer ---------- */}
      {footer}
    </PageShell>
  );
}

// #endregion
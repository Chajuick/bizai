import * as React from "react";
import { Link } from "wouter";

import PageShell from "@/components/focuswin/common/page-shell";
import PageHeader, { type HeaderAction } from "@/components/focuswin/common/page-header";
import SkeletonCardList from "@/components/focuswin/common/skeleton-card-list";
import Fab from "@/components/focuswin/common/fab";

/** PageHeader 액션 타입을 그대로 사용 */
export type PageStatus = "loading" | "empty" | "ready";

/** Fab은 기존 UIAction 유지해도 되고, HeaderAction으로 통일해도 됨 */
export type UIAction =
  | { label: string; icon?: React.ReactNode; onClick: () => void; disabled?: boolean }
  | { label: string; icon?: React.ReactNode; href: string; disabled?: boolean };
export type PageFab = UIAction & { icon: React.ReactNode };

export type PageScaffoldProps = {
  // Header
  kicker: string;
  /** ✅ string -> ReactNode */
  title: React.ReactNode;
  description?: React.ReactNode;

  /** ✅ PageHeader 고급 옵션 노출 */
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

  fab?: PageFab;
  contentClassName?: string;
};

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

      {notice ? <div className="mt-4">{notice}</div> : null}

      <div className={contentClassName}>
        {status === "loading" ? (
          loading ?? <SkeletonCardList count={6} variant="detailed" />
        ) : status === "empty" ? (
          empty ?? null
        ) : (
          children
        )}
      </div>

      {fab ? (
        isHrefAction(fab) ? (
          <Link href={fab.href}>
            <Fab label={fab.label} onClick={() => {}}>
              {fab.icon}
            </Fab>
          </Link>
        ) : (
          <Fab label={fab.label} onClick={fab.onClick}>
            {fab.icon}
          </Fab>
        )
      ) : null}

      {footer}
    </PageShell>
  );
}

function isHrefAction(a: UIAction): a is Extract<UIAction, { href: string }> {
  return "href" in a;
}
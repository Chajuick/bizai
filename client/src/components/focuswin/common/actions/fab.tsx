import React from "react";
import { Link } from "wouter";


// #region Types

type FabAction =
  | { href: string; onClick?: never }
  | { onClick: () => void; href?: never };

type FabProps = FabAction & {
  children: React.ReactNode;
  label?: string;
  className?: string;
  hideOnLg?: boolean;
};

// #endregion


// #region Type Guards

function isHrefAction(
  props: FabProps
): props is FabProps & { href: string } {
  return "href" in props && typeof props.href === "string";
}

// #endregion


// #region Component

export default function Fab(props: FabProps) {
  const {
    children,
    label,
    className = "",
    hideOnLg = true,
  } = props;

  // #region Style

  const baseClass = [
    "fixed bottom-20 right-5 w-14 h-14 rounded-full text-white",
    "flex items-center justify-center",
    "shadow-[0_12px_28px_rgba(37,99,235,0.30)]",
    hideOnLg ? "lg:hidden" : "",
    className,
  ].join(" ");

  const style = {
    background: "rgb(37, 99, 235)",
  };

  // #endregion


  // #region Link Mode

  if (isHrefAction(props)) {
    return (
      <Link href={props.href}>
        <button
          type="button"
          aria-label={label}
          className={baseClass}
          style={style}
        >
          {children}
        </button>
      </Link>
    );
  }

  // #endregion


  // #region Button Mode

  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={label}
      className={baseClass}
      style={style}
    >
      {children}
    </button>
  );

  // #endregion
}

// #endregion
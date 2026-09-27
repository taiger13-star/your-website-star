import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: { label: string; to: string };
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-hairline bg-surface px-6 py-20 text-center">
      {children ? <div className="mb-6 text-taupe">{children}</div> : null}
      <h2 className="display-md text-foreground">{title}</h2>
      <p className="prose-noir mx-auto mt-4 text-sm">{description}</p>
      {action ? (
        <Link
          to={action.to}
          className="mt-8 inline-flex items-center justify-center bg-ink px-8 py-3 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground transition-opacity duration-300 hover:opacity-85"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

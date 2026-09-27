import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

export const ctaStyles =
  "inline-flex items-center justify-center bg-ink px-8 py-4 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground transition-opacity duration-300 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40";

export const ctaGhostStyles =
  "inline-flex items-center justify-center border border-ink/25 px-8 py-4 text-xs font-medium uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:border-ink";

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`container-page py-16 md:py-24 ${className}`}>
      {children}
    </section>
  );
}

export function PageHeader({
  crumbs,
  eyebrow,
  title,
  lead,
  aside,
}: {
  crumbs?: Crumb[];
  eyebrow?: string;
  title: string;
  lead?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="container-page pt-10 md:pt-14">
      {crumbs ? <Breadcrumbs items={crumbs} /> : null}
      <div className="mt-6 flex flex-col gap-8 border-b border-hairline pb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <p className="label-caps text-taupe">{eyebrow}</p> : null}
          <h1 className="display-lg mt-4 text-foreground">{title}</h1>
          {lead ? <p className="prose-noir mt-5">{lead}</p> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </div>
  );
}

export function LinkCTA({
  to,
  children,
  variant = "solid",
  className = "",
}: {
  to: string;
  children: ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
}) {
  const styles = variant === "solid" ? ctaStyles : ctaGhostStyles;
  return (
    <Link to={to} className={`${styles} ${className}`}>
      {children}
    </Link>
  );
}

export function PlaceholderNote({ children }: { children: ReactNode }) {
  return (
    <p className="border border-dashed border-taupe/50 bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

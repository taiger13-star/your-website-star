import { Link } from "@tanstack/react-router";

import { BRAND, CONTACT, FOOTER_SECTIONS, PLACEHOLDER_NOTE } from "@/lib/brand";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-hairline bg-surface">
      <div className="container-page py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <p className="text-2xl tracking-[0.32em] text-foreground">
              {BRAND.name.split(" ")[0]}
              <span className="text-taupe"> {BRAND.name.split(" ")[1]}</span>
            </p>
            <p className="label-caps mt-4 text-taupe">{BRAND.values}</p>
            <p className="prose-noir mt-6 text-sm">{BRAND.heroLine}</p>
            <div className="mt-8 space-y-1 text-sm text-ink-soft">
              <p>{CONTACT.phone}</p>
              <p>{CONTACT.email}</p>
              <p>{CONTACT.telegram}</p>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {FOOTER_SECTIONS.map((section) => (
              <nav key={section.title} aria-label={section.title}>
                <h2 className="label-caps text-taupe">{section.title}</h2>
                <ul className="mt-5 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-ink-soft transition-colors duration-300 hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-hairline pt-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {BRAND.name}. {BRAND.production}. {BRAND.country}.
          </p>
          <p className="max-w-md md:text-right">{PLACEHOLDER_NOTE}</p>
        </div>
      </div>
    </footer>
  );
}

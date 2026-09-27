import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

import { BRAND, CONTACT, NAV_LINKS } from "@/lib/brand";
import { useShopUI } from "@/store/ui";

const UTILITY_LINKS = [
  { label: "Избранное", to: "/wishlist" },
  { label: "Корзина", to: "/cart" },
  { label: "Оформить заказ", to: "/checkout" },
  { label: "Доставка и получение", to: "/delivery" },
  { label: "Контакты", to: "/contacts" },
];

export function MobileMenu() {
  const { menuOpen, closeMenu } = useShopUI();

  return (
    <SheetPrimitive.Root open={menuOpen} onOpenChange={(open) => (open ? undefined : closeMenu())}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <SheetPrimitive.Content
          side="left"
          className="fixed inset-y-0 left-0 z-50 flex h-full w-[min(88vw,22rem)] flex-col border-r border-hairline bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
        >
          <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
            <SheetPrimitive.Title className="text-sm font-medium tracking-[0.3em]">
              {BRAND.name}
            </SheetPrimitive.Title>
            <SheetPrimitive.Close
              aria-label="Закрыть меню"
              className="flex h-9 w-9 items-center justify-center text-ink-soft transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" strokeWidth={1.25} />
            </SheetPrimitive.Close>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 py-8" aria-label="Мобильная навигация">
            <ul className="space-y-5">
              {NAV_LINKS.map((item) => (
                <li key={item.to}>
                  <SheetPrimitive.Description asChild>
                    <Link
                      to={item.to}
                      onClick={closeMenu}
                      className="font-display text-2xl text-foreground"
                    >
                      {item.label}
                    </Link>
                  </SheetPrimitive.Description>
                </li>
              ))}
            </ul>

            <div className="mt-10 border-t border-hairline pt-8">
              <p className="label-caps text-taupe">Покупателю</p>
              <ul className="mt-4 space-y-3">
                {UTILITY_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={closeMenu}
                      className="text-sm text-ink-soft transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="border-t border-hairline px-6 py-6 text-xs text-muted-foreground">
            <p>{CONTACT.phone}</p>
            <p className="mt-1">{CONTACT.email}</p>
            <p className="mt-3">{BRAND.production}</p>
          </div>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

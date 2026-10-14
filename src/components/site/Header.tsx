import { Link } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";

import { BRAND, NAV_LINKS } from "@/lib/brand";
import { useCart } from "@/store/cart";
import { useShopUI } from "@/store/ui";
import { useWishlist } from "@/store/wishlist";
import { useAccount } from "@/store/account";
import { MobileMenu } from "./MobileMenu";

function IconButton({
  label,
  onClick,
  badge,
  children,
}: {
  label: string;
  onClick: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center text-ink-soft transition-colors duration-300 hover:text-foreground"
    >
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-medium leading-none text-primary-foreground">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function Header() {
  const { count, hydrated } = useCart();
  const wishlist = useWishlist();
  const account = useAccount();
  const { openCart, openSearch, openMenu } = useShopUI();

  const badge = hydrated ? count : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur-md">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-6 md:h-20">
          <Link
            to="/"
            className="shrink-0 text-sm font-medium tracking-[0.34em] text-foreground md:text-base"
          >
            {BRAND.name}
          </Link>

          <nav className="hidden items-center gap-6 xl:flex" aria-label="Основная навигация">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                {...(item.hash ? { hash: item.hash, activeOptions: { includeHash: true } } : {})}
                className="label-caps text-ink-soft transition-colors duration-300 hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <IconButton label="Поиск" onClick={openSearch}>
              <Search className="h-[18px] w-[18px]" strokeWidth={1.25} />
            </IconButton>
            <Link
              to="/wishlist"
              aria-label="Избранное"
              className="relative hidden h-10 w-10 items-center justify-center text-ink-soft transition-colors duration-300 hover:text-foreground sm:flex"
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.25} />
              {wishlist.hydrated && wishlist.count ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-medium leading-none text-primary-foreground">
                  {wishlist.count}
                </span>
              ) : null}
            </Link>
            <IconButton label="Корзина" onClick={openCart} badge={badge}>
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.25} />
            </IconButton>
            <Link
              to={account.user ? "/account" : "/login"}
              aria-label={account.user ? "Личный кабинет" : "Войти"}
              className="flex h-10 w-10 items-center justify-center text-ink-soft transition-colors hover:text-foreground"
            >
              <UserRound className="h-[18px] w-[18px]" strokeWidth={1.25} />
            </Link>
            <button
              type="button"
              onClick={openMenu}
              aria-label="Меню"
              className="flex h-10 w-10 items-center justify-center text-ink-soft transition-colors duration-300 hover:text-foreground xl:hidden"
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.25} />
            </button>
          </div>
        </div>
      </div>

      <MobileMenu />
    </header>
  );
}

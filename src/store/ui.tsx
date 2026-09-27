import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type UIContextValue = {
  cartOpen: boolean;
  searchOpen: boolean;
  menuOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openMenu: () => void;
  closeMenu: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const value = useMemo<UIContextValue>(
    () => ({
      cartOpen,
      searchOpen,
      menuOpen,
      openCart,
      closeCart,
      openSearch,
      closeSearch,
      openMenu,
      closeMenu,
    }),
    [cartOpen, searchOpen, menuOpen, openCart, closeCart, openSearch, closeSearch, openMenu, closeMenu],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useShopUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useShopUI must be used inside <UIProvider>");
  return ctx;
}

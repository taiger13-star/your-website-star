import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { counterId } from "@/lib/analytics";
import { isPrivatePath, SITE_ORIGIN } from "@/lib/seo";

let initialised: number | null = null;
let lastPath = "";
export function Analytics() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const id = counterId();
    // Preview runs must never pollute production reports, even with a production .env.
    if (!id || window.location.origin !== SITE_ORIGIN || isPrivatePath(path)) return;
    if (initialised !== id) {
      const existing = document.querySelector('script[src*="mc.yandex.ru/metrika/tag.js"]');
      if (!window.ym) {
        const queue = Object.assign(
          (...args: unknown[]) => {
            queue.a.push(args);
          },
          { a: [] as unknown[][], l: Date.now() },
        );
        window.ym = queue;
      }
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://mc.yandex.ru/metrika/tag.js";
        script.async = true;
        document.head.appendChild(script);
        // Disable URL/session recording of personal form fields and private pages.
        window.ym(id, "init", { defer: true, clickmap: false, trackLinks: false, webvisor: false });
      }
      initialised = id;
    }
    if (isPrivatePath(path) || lastPath === path) return;
    lastPath = path;
    window.ym?.(id, "hit", `${SITE_ORIGIN}${path}`);
  }, [path]);
  return null;
}

// No tracking requests unless a real counter ID is explicitly configured.
// Never send names, contacts, files, free text or a private URL to analytics.
export type Goal =
  "add_to_cart" | "begin_checkout" | "order_created" | "generate_lead" | "purchase";
type GoalData = {
  value?: number;
  currency?: "RUB";
  order_id?: string;
  product_id?: string;
  quantity?: number;
  form?: "3d-printing" | "3d-design" | "business";
};
type Ym = (...args: unknown[]) => void;
declare global {
  interface Window {
    ym?: Ym;
  }
}

export function counterId(value = import.meta.env["VITE_METRIKA_COUNTER_ID"]): number | null {
  return /^\d{1,12}$/.test(value ?? "") && Number(value) > 0 ? Number(value) : null;
}

export function trackGoal(name: Goal, data: GoalData = {}) {
  const id = counterId();
  if (!id || typeof window === "undefined") return;
  try {
    window.ym?.(id, "reachGoal", name, data);
  } catch {
    /* Analytics cannot break checkout. */
  }
}

export function trackVerifiedPurchase(
  payment: { status: string; provider: string | null } | undefined,
  order: { id: string; subtotal: number },
) {
  if (
    !payment ||
    payment.status !== "paid" ||
    !payment.provider ||
    payment.provider === "mock" ||
    !counterId() ||
    typeof window === "undefined"
  )
    return false;
  try {
    const key = `noir-analytics-purchase:${order.id}`;
    if (localStorage.getItem(key) || !window.ym) return false;
    trackGoal("purchase", { order_id: order.id, value: order.subtotal, currency: "RUB" });
    localStorage.setItem(key, "sent");
    return true;
  } catch {
    return false;
  }
}

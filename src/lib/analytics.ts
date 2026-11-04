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
  if (!id || typeof window === "undefined" || !window.ym) return false;
  try {
    // Metrika uses order_price/price for goal revenue; value alone is a custom parameter.
    window.ym(id, "reachGoal", name, {
      ...data,
      ...(data.value !== undefined ? { order_price: data.value } : {}),
    });
    return true;
  } catch {
    /* Analytics cannot break checkout. */
    return false;
  }
}

export function trackVerifiedPurchase(
  payment:
    | {
        component: string;
        status: string;
        provider: string | null;
        amount: number;
        currency: string;
        paidAt: Date | string | null;
      }
    | undefined,
  order: { id: string; total: number; status: string },
) {
  if (
    !payment ||
    payment.component !== "product" ||
    payment.status !== "paid" ||
    !payment.paidAt ||
    !Number.isFinite(new Date(payment.paidAt).getTime()) ||
    !payment.provider ||
    payment.provider === "mock" ||
    payment.currency !== "RUB" ||
    !Number.isFinite(order.total) ||
    order.total <= 0 ||
    payment.amount !== order.total ||
    order.status === "cancelled" ||
    !counterId() ||
    typeof window === "undefined"
  )
    return false;
  try {
    const key = `noir-analytics-purchase:${order.id}`;
    if (localStorage.getItem(key) || !window.ym) return false;
    if (!trackGoal("purchase", { order_id: order.id, value: payment.amount, currency: "RUB" }))
      return false;
    localStorage.setItem(key, "sent");
    return true;
  } catch {
    return false;
  }
}

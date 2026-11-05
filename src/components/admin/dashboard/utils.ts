export const statusLabels: Record<string, string> = {
  new: "Новый",
  in_progress: "В работе",
  awaiting_customer: "Ожидает клиента",
  ready: "Готов",
  completed: "Завершён",
  cancelled: "Отменён",
};
export const rub = (n: number | null) =>
  n === null
    ? "—"
    : new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(n);

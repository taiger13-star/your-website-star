export type OrderPaymentStatus = "pending" | "mock_paid" | "awaiting_receipt" | "paid";

export function paymentStatusLabel(status: OrderPaymentStatus | null | undefined): string {
  switch (status) {
    case "pending":
      return "Ожидает тестовой оплаты";
    case "mock_paid":
      return "Оплачено (тест)";
    case "awaiting_receipt":
      return "Ожидает оплаты при получении";
    case "paid":
      return "Оплачено";
    default:
      return "Нет сведений об оплате";
  }
}

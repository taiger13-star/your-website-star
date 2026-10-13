import { createFileRoute } from "@tanstack/react-router";

import { LegalDocumentPage } from "@/components/site/LegalDocumentPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Пользовательское соглашение — NOIR ATELIER" },
      {
        name: "description",
        content: "Условия использования сайта, заказа, оплаты, доставки и возврата NOIR ATELIER.",
      },
    ],
  }),
  component: () => <LegalDocumentPage documentKey="terms" />,
});

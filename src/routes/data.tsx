import { createFileRoute } from "@tanstack/react-router";

import { LegalDocumentPage } from "@/components/site/LegalDocumentPage";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Согласие на обработку персональных данных — NOIR ATELIER" },
      {
        name: "description",
        content: "Согласие на обработку персональных данных заявки «Для бизнеса».",
      },
    ],
  }),
  component: () => <LegalDocumentPage documentKey="data" />,
});

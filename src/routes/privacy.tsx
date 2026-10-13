import { createFileRoute } from "@tanstack/react-router";

import { LegalDocumentPage } from "@/components/site/LegalDocumentPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Политика обработки персональных данных — NOIR ATELIER" },
      {
        name: "description",
        content: "Политика обработки персональных данных на сайте NOIR ATELIER.",
      },
    ],
  }),
  component: () => <LegalDocumentPage documentKey="privacy" />,
});

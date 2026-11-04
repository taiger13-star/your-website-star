import { createFileRoute } from "@tanstack/react-router";

import { LegalDocumentPage } from "@/components/site/LegalDocumentPage";

export const Route = createFileRoute("/terms")({
  component: () => <LegalDocumentPage documentKey="terms" />,
});

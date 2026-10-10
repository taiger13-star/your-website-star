import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/collections")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "collections", replace: true });
  },
});

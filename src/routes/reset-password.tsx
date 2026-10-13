import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { resetPasswordFn } from "@/lib/account-functions";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await resetPasswordFn({
        data: {
          token,
          password: String(form.get("password")),
          confirmPassword: String(form.get("confirmPassword")),
        },
      });
      setDone(true);
      setMessage("Пароль изменён. Войдите с новым паролем.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось изменить пароль.");
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        <h1 className="display-md">Новый пароль</h1>
        {!done && token ? (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-sm">
              Пароль
              <input
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                className="mt-2 w-full border border-hairline bg-background px-3 py-3"
              />
            </label>
            <label className="block text-sm">
              Подтверждение пароля
              <input
                name="confirmPassword"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                className="mt-2 w-full border border-hairline bg-background px-3 py-3"
              />
            </label>
            <button
              disabled={pending}
              className="w-full bg-ink px-5 py-3 text-xs uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
            >
              Сохранить пароль
            </button>
          </form>
        ) : null}
        <p role="status" className="mt-5 text-sm">
          {message || (!token ? "Ссылка недействительна." : "")}
        </p>
        <Link to="/login" className="mt-5 inline-block text-sm underline">
          Ко входу
        </Link>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { getAuthEmailModeFn, requestPasswordResetFn } from "@/lib/account-functions";

export const Route = createFileRoute("/forgot-password")({
  loader: () => getAuthEmailModeFn(),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const emailMode = Route.useLoaderData();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const email = String(new FormData(event.currentTarget).get("email"));
    try {
      await requestPasswordResetFn({ data: { email } });
      setMessage("Если аккаунт существует, мы отправили письмо для сброса пароля.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось отправить письмо.");
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        <h1 className="display-md">Восстановление пароля</h1>
        {emailMode === "smtp" ? (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-sm">
              Почта
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full border border-hairline bg-background px-3 py-3"
              />
            </label>
            <button
              disabled={pending}
              className="w-full bg-ink px-5 py-3 text-xs uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
            >
              Отправить ссылку
            </button>
          </form>
        ) : (
          <p className="mt-8 text-sm">Восстановление пароля временно недоступно без почты.</p>
        )}
        {message ? (
          <p role="status" className="mt-5 text-sm">
            {message}
          </p>
        ) : null}
        <Link to="/login" className="mt-5 inline-block text-sm underline">
          Ко входу
        </Link>
      </div>
    </div>
  );
}

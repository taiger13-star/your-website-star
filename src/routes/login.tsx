import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { getAuthEmailModeFn, loginUserFn } from "@/lib/account-functions";
import { useAccount } from "@/store/account";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) =>
    search["next"] === "/checkout" ? { next: "/checkout" as const } : {},
  loader: () => getAuthEmailModeFn(),
  component: LoginPage,
});

function LoginPage() {
  const { next } = Route.useSearch();
  const emailMode = Route.useLoaderData();
  const account = useAccount();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const user = await loginUserFn({
        data: { email: String(form.get("email")), password: String(form.get("password")) },
      });
      account.setUser(user);
      await navigate({ to: next ?? "/account" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось войти.");
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        <p className="label-caps text-taupe">Аккаунт</p>
        <h1 className="display-md mt-3">Вход</h1>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm">
            Почта
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-2 w-full border border-hairline bg-background px-3 py-3"
            />
          </label>
          <label className="block text-sm">
            Пароль
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full border border-hairline bg-background px-3 py-3"
            />
          </label>
          <button
            disabled={pending}
            className="w-full bg-ink px-5 py-3 text-xs uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
          >
            {pending ? "Входим…" : "Войти"}
          </button>
        </form>
        {message ? (
          <p role="alert" className="mt-5 text-sm">
            {message}
          </p>
        ) : null}
        <div className="mt-6 flex justify-between gap-4 text-sm">
          <Link to="/register" search={next ? { next } : {}} className="underline">
            Регистрация
          </Link>
          {emailMode === "smtp" ? (
            <Link to="/forgot-password" className="underline">
              Забыли пароль?
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

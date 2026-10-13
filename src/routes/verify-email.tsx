import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import {
  getAuthEmailModeFn,
  resendVerificationFn,
  verifyEmailCodeFn,
  verifyEmailFn,
} from "@/lib/account-functions";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
    email: typeof search["email"] === "string" ? search["email"] : "",
    next: search["next"] === "/checkout" ? ("/checkout" as const) : undefined,
  }),
  loader: () => getAuthEmailModeFn(),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token, email: initialEmail, next } = Route.useSearch();
  const mode = Route.useLoaderData();
  const [message, setMessage] = useState(token ? "Проверяем ссылку…" : "");
  const [code, setCode] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const submitted = useRef("");
  useEffect(() => {
    if (!token) return;
    if (submitted.current === token) return;
    submitted.current = token;
    void verifyEmailFn({ data: { token } })
      .then(() => {
        setDone(true);
        setMessage("Почта подтверждена. Теперь можно войти.");
      })
      .catch((error) =>
        setMessage(error instanceof Error ? error.message : "Ссылка недействительна."),
      );
  }, [token]);
  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!initialEmail || code.length !== 4) return;
    setPending(true);
    setMessage("");
    try {
      await verifyEmailCodeFn({ data: { email: initialEmail, code } });
      setDone(true);
      setMessage("Почта подтверждена. Теперь можно войти.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось подтвердить почту.");
    } finally {
      setPending(false);
    }
  };
  const resend = async () => {
    if (!initialEmail) return;
    setPending(true);
    setMessage("");
    try {
      await resendVerificationFn({ data: { email: initialEmail } });
      setCode("");
      setMessage("Код обновлён. Введите его в поле выше.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось обновить код.");
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        <h1 className="display-md">Подтверждение почты</h1>
        {!token && mode === "stub" && !done ? (
          <>
            {initialEmail ? (
              <>
                <form onSubmit={verifyCode} className="mt-9">
                  <label htmlFor="verification-code" className="mb-3 block text-sm">
                    Код подтверждения
                  </label>
                  <InputOTP
                    id="verification-code"
                    maxLength={4}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={setCode}
                    disabled={pending}
                    containerClassName="justify-center"
                  >
                    <InputOTPGroup className="gap-3">
                      {[0, 1, 2, 3].map((index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="h-14 w-14 rounded-none border border-hairline bg-background text-xl font-medium shadow-none first:rounded-none last:rounded-none"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <button
                    disabled={pending || code.length !== 4}
                    className="mt-8 w-full bg-ink px-5 py-4 text-xs uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
                  >
                    {pending ? "Подтверждаем…" : "Подтвердить"}
                  </button>
                </form>
                <button
                  type="button"
                  disabled={pending}
                  onClick={resend}
                  className="mt-3 w-full border border-hairline px-5 py-4 text-xs uppercase tracking-[0.16em] transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Обновить код
                </button>
              </>
            ) : (
              <p className="mt-6 text-sm">
                Адрес почты не найден.{" "}
                <Link
                  to="/register"
                  search={next ? { next } : {}}
                  className="underline underline-offset-4"
                >
                  Вернитесь к регистрации.
                </Link>
              </p>
            )}
          </>
        ) : null}
        {!token && mode === "smtp" ? (
          <p className="mt-5">Откройте ссылку из письма для подтверждения.</p>
        ) : null}
        {message ? (
          <p role="status" className="mt-5 text-sm">
            {message}
          </p>
        ) : null}
        <Link
          to="/login"
          search={next ? { next } : {}}
          className="mt-6 flex w-full items-center justify-center py-3 text-sm underline underline-offset-4 transition-colors hover:text-taupe"
        >
          Перейти ко входу
        </Link>
      </div>
    </div>
  );
}

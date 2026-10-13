import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { registerUserFn, resendVerificationFn } from "@/lib/account-functions";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) =>
    search["next"] === "/checkout" ? { next: "/checkout" as const } : {},
  component: RegisterPage,
});

function RegisterPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await registerUserFn({
        data: {
          name: String(form.get("name")),
          gender: (form.get("gender") || null) as "male" | "female" | null,
          email: String(form.get("email")),
          password: String(form.get("password")),
          confirmPassword: String(form.get("confirmPassword")),
        },
      });
      const registeredEmail = String(form.get("email"));
      setEmail(registeredEmail);
      if (result.verificationMode === "stub") {
        await navigate({
          to: "/verify-email",
          search: { email: registeredEmail, token: "", next },
        });
      } else {
        setSent(result.emailSent);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось зарегистрироваться.");
    } finally {
      setPending(false);
    }
  };

  const resend = async () => {
    setPending(true);
    setMessage("");
    try {
      await resendVerificationFn({ data: { email } });
      setSent(true);
      setMessage("Если аккаунт ожидает подтверждения, письмо отправлено.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось отправить письмо.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        <p className="label-caps text-taupe">Аккаунт</p>
        <h1 className="display-md mt-3">Регистрация</h1>
        {sent !== null ? (
          <div className="mt-8 space-y-5 text-sm">
            <p>
              {sent
                ? "Письмо для подтверждения отправлено на вашу почту."
                : "Аккаунт создан, но письмо пока не отправлено. Попробуйте отправить его ещё раз."}
            </p>
            <p>Подтвердите адрес по ссылке в письме, затем войдите.</p>
            <button type="button" disabled={pending} onClick={resend} className="underline">
              Отправить письмо повторно
            </button>
            <p>
              <Link to="/login" search={next ? { next } : {}} className="underline">
                Перейти ко входу
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <Field label="Имя" name="name" autoComplete="name" required />
            <label className="block text-sm">
              Пол
              <select
                name="gender"
                className="mt-2 w-full border border-hairline bg-background px-3 py-3"
              >
                <option value="">Не указывать</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </label>
            <Field label="Почта" name="email" type="email" autoComplete="email" required />
            <Field
              label="Пароль"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <Field
              label="Подтверждение пароля"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button
              disabled={pending}
              className="w-full bg-ink px-5 py-3 text-xs uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
            >
              {pending ? "Создаём…" : "Зарегистрироваться"}
            </button>
            <p className="text-sm">
              Уже есть аккаунт?{" "}
              <Link to="/login" search={next ? { next } : {}} className="underline">
                Войти
              </Link>
            </p>
          </form>
        )}
        {message ? (
          <p role="alert" className="mt-5 text-sm">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Field(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string },
) {
  const { label, ...input } = props;
  return (
    <label className="block text-sm">
      {label}
      <input {...input} className="mt-2 w-full border border-hairline bg-background px-3 py-3" />
    </label>
  );
}

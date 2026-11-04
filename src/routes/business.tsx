import { trackGoal } from "@/lib/analytics";
import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";

import businessImg from "@/assets/business.jpg";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { createProjectInquiryFn } from "@/lib/server-functions";

export const Route = createFileRoute("/business")({
  component: BusinessPage,
});

const capabilities = [
  "Индивидуальные размеры",
  "Фирменные цвета",
  "Нанесение логотипа",
  "Малые и серийные тиражи",
  "Разработка изделия под проект",
  "Прототипирование",
  "Специальные условия при объёме",
];

function BusinessPage() {
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("personalDataConsent") !== "on") {
      toast.error("Необходимо согласие на обработку персональных данных.");
      return;
    }
    setPending(true);
    try {
      await createProjectInquiryFn({
        data: {
          contactName: String(form.get("name") ?? ""),
          company: String(form.get("company") ?? ""),
          phone: String(form.get("phone") ?? ""),
          email: String(form.get("email") ?? ""),
          projectDetails: String(form.get("project") ?? ""),
          personalDataConsent: true,
        },
      });
      setSubmitted(true);
      trackGoal("generate_lead", { form: "business" });
      toast.success("Запрос отправлен");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отправить запрос");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="container-page pt-10 md:pt-14">
        <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Для бизнеса" }]} />
        <div className="mt-6 grid gap-10 border-b border-hairline pb-12 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="label-caps text-taupe">B2B · NOIR ATELIER</p>
            <h1 className="display-lg mt-4">Предметы, созданные для вашего проекта</h1>
            <p className="prose-noir mt-6">
              Работаем с дизайнерами интерьера, архитекторами, ресторанами, отелями, офисами,
              девелоперами, цветочными и интерьерными салонами. Берём на себя путь от задачи и
              прототипа до согласованной серии.
            </p>
          </div>
          <figure className="overflow-hidden bg-secondary">
            <img
              src={businessImg}
              alt="Кашпо NOIR ATELIER в общественном интерьере"
              className="h-full w-full object-cover"
            />
          </figure>
        </div>
      </div>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="label-caps text-taupe">Возможности</p>
            <h2 className="display-md mt-4">Не только выбор из каталога</h2>
            <p className="prose-noir mt-6">
              Адаптируем существующую форму или разрабатываем новую под архитектуру, сценарий
              использования и бюджет. Для серий согласуем образец, цвет и сроки до запуска.
            </p>
          </div>
          <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {capabilities.map((item) => (
              <li key={item} className="flex gap-3 border-b border-hairline pb-4 text-sm text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-deep" strokeWidth={1.5} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-12 border border-hairline p-6 md:p-8">
          <p className="label-caps text-taupe">Отдельная деталь или прототип?</p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Для печати по готовой 3D-модели доступен предварительный расчёт. Если есть только идея
            или эскиз, начнём с разработки изделия.
          </p>
          <Link
            to="/3d-printing"
            className="mt-5 inline-block text-xs uppercase tracking-[0.16em] underline"
          >
            Печать по готовой модели
          </Link>
          <Link
            to="/3d-design"
            className="ml-0 mt-5 inline-block text-xs uppercase tracking-[0.16em] underline sm:ml-7"
          >
            Разработка изделия с нуля
          </Link>
        </div>
      </section>

      <section id="project-form" className="border-y border-hairline bg-ink">
        <div className="container-page py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="label-caps text-sand">Обсудить проект</p>
              <h2 className="display-md mt-4 text-sand">
                Расскажите, что нужно вашему пространству
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-sand/75">
                Укажите формат проекта, количество, желаемые размеры и сроки. Мы вернёмся с
                вопросами или предложим следующий шаг.
              </p>
            </div>
            {submitted ? (
              <div className="border border-sand/30 p-8 md:p-10">
                <p className="label-caps text-sand">Запрос отправлен</p>
                <h3 className="mt-4 font-display text-4xl text-sand">Спасибо за проект</h3>
                <p className="mt-5 max-w-lg text-sm leading-relaxed text-sand/75">
                  Мы получили описание проекта. Свяжемся с вами, чтобы уточнить детали и предложить
                  следующий шаг.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-8 border border-sand/40 px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-sand transition-colors hover:border-sand"
                >
                  Отправить ещё один запрос
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                <FormField label="Ваше имя" name="name" autoComplete="name" required />
                <FormField label="Компания / студия" name="company" autoComplete="organization" />
                <FormField label="Телефон" name="phone" type="tel" autoComplete="tel" required />
                <FormField label="Email" name="email" type="email" autoComplete="email" required />
                <label className="sm:col-span-2">
                  <span className="label-caps text-sand/70">О проекте</span>
                  <textarea
                    name="project"
                    required
                    rows={5}
                    placeholder="Тип пространства, количество, размеры, желаемые сроки"
                    className="mt-2 w-full resize-y border border-sand/30 bg-transparent px-4 py-3 text-sm text-sand outline-none placeholder:text-sand/45 focus:border-sand"
                  />
                </label>
                <div className="sm:col-span-2 flex items-start gap-3 text-xs leading-relaxed text-sand/75">
                  <input
                    id="personal-data-consent"
                    type="checkbox"
                    name="personalDataConsent"
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 accent-sand"
                  />
                  <div>
                    <label htmlFor="personal-data-consent">
                      Я даю согласие на обработку персональных данных для ответа на заявку.
                    </label>{" "}
                    <Link to="/data" className="underline underline-offset-2 hover:text-sand">
                      Прочитать согласие
                    </Link>
                  </div>
                </div>
                <div className="sm:col-span-2 flex flex-wrap items-center gap-5 pt-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="bg-sand px-8 py-4 text-xs font-medium uppercase tracking-[0.18em] text-ink transition-opacity hover:opacity-90"
                  >
                    {pending ? "Отправляем…" : "Обсудить проект"}
                  </button>
                  <Link
                    to="/privacy"
                    className="max-w-sm text-xs leading-relaxed text-sand/60 underline underline-offset-2 hover:text-sand"
                  >
                    Политика обработки персональных данных
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function FormField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label>
      <span className="label-caps text-sand/70">{label}</span>
      <input
        {...props}
        className="mt-2 w-full border border-sand/30 bg-transparent px-4 py-3 text-sm text-sand outline-none placeholder:text-sand/45 focus:border-sand"
      />
    </label>
  );
}

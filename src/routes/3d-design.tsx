import { useRef, useState, type FormEvent, type InputHTMLAttributes, type Ref } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, FileUp, Lightbulb, PencilRuler, Printer, X } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { createCustomPrintInquiryFn } from "@/lib/custom-print-functions";
import { CONTACT_PHONE_ERROR, normalizeContactPhone } from "@/lib/contact-phone";

export const Route = createFileRoute("/3d-design")({
  head: () => ({
    meta: [
      { title: "Разработка изделия с нуля — NOIR ATELIER" },
      {
        name: "description",
        content:
          "Разработаем 3D-изделие по вашей идее, эскизу, фотографии или образцу: обсудим задачу, согласуем модель и изготовим прототип или готовое изделие.",
      },
    ],
  }),
  component: DesignPage,
});

const stages = [
  [
    Lightbulb,
    "Обсуждаем задачу",
    "Расскажите, для чего нужен предмет. Пришлите эскиз, фото или описание — готовая модель не требуется.",
  ],
  [
    PencilRuler,
    "Разрабатываем и согласуем",
    "Уточняем размеры и требования, создаём 3D-модель и согласуем её с вами до изготовления.",
  ],
  [
    Printer,
    "Проверяем и изготавливаем",
    "При необходимости печатаем прототип, вносим согласованные изменения и выпускаем готовое изделие.",
  ],
] as const;

function DesignPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const chooseFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files, ...Array.from(incoming)];
    if (
      next.length > 3 ||
      next.some((file) => file.size > 20 * 1024 * 1024) ||
      next.reduce((sum, file) => sum + file.size, 0) > 40 * 1024 * 1024
    ) {
      toast.error("Не более 3 файлов: до 20 МБ каждый и до 40 МБ суммарно.");
      return;
    }
    if (
      next.some(
        (file) => !/\.(stl|obj|3mf|step|stp|iges|igs|zip|pdf|png|jpe?g|webp)$/i.test(file.name),
      )
    ) {
      toast.error("Поддерживаются изображения, PDF, ZIP и 3D-файлы из списка форматов.");
      return;
    }
    setFiles(next);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = normalizeContactPhone(String(form.get("phone") ?? ""));
    if (!phone) {
      setPhoneError(CONTACT_PHONE_ERROR);
      phoneInputRef.current?.focus();
      return;
    }
    setPhoneError(null);
    form.set("phone", phone);
    form.set("modelStatus", "need-modeling");
    form.set("quantity", String(Number(form.get("quantity")) || 1));
    form.delete("files");
    files.forEach((file) => form.append("files", file));
    setSending(true);
    try {
      await createCustomPrintInquiryFn({ data: form });
      setSubmitted(true);
      toast.success("Заявка отправлена");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отправить заявку.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <section className="container-page pt-10 pb-16 md:pt-14 md:pb-24">
        <Breadcrumbs
          items={[{ label: "Главная", to: "/" }, { label: "Разработка изделия с нуля" }]}
        />
        <div className="mt-9 grid items-end gap-10 lg:grid-cols-[1.2fr_.8fr] lg:gap-16">
          <div>
            <p className="label-caps text-taupe">NOIR ATELIER · Разработка изделия</p>
            <h1 className="display-xl mt-5 text-foreground">
              От идеи
              <br />
              <em>до готового предмета.</em>
            </h1>
            <p className="prose-noir mt-7 max-w-2xl">
              Есть идея, эскиз, фото или образец? Вместе уточним назначение и требования,
              разработаем 3D-модель, согласуем её с вами и изготовим изделие. Можно начать даже с
              описания словами.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#request"
                className="inline-flex items-center gap-3 bg-ink px-7 py-4 text-xs font-medium uppercase tracking-[0.16em] text-sand"
              >
                Обсудить изделие <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#process"
                className="border border-ink/25 px-7 py-4 text-xs font-medium uppercase tracking-[0.16em] text-ink"
              >
                Этапы работы
              </a>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Выберите услугу">
              <Link
                to="/3d-printing"
                className="border border-hairline px-5 py-4 text-xs uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
              >
                Есть 3D-модель · печать <ArrowRight className="ml-2 inline h-3 w-3" />
              </Link>
              <span className="border border-ink bg-ink px-5 py-4 text-xs uppercase tracking-[0.12em] text-sand">
                Есть идея или эскиз · разработка
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px border border-hairline bg-hairline">
            {[
              ["01", "Идея или эскиз"],
              ["02", "Обсуждение задачи"],
              ["03", "Согласование модели"],
              ["04", "Прототип и печать"],
            ].map(([number, label]) => (
              <div key={number} className="min-h-36 bg-surface p-5 md:p-7">
                <span className="font-display text-4xl text-taupe">{number}</span>
                <p className="mt-5 text-sm text-ink">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="scroll-mt-24 border-y border-hairline bg-surface">
        <div className="container-page py-16 md:py-20">
          <p className="label-caps text-taupe">Как мы работаем</p>
          <h2 className="display-md mt-4 max-w-3xl">
            Ваш замысел станет предметом, который можно использовать
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {stages.map(([Icon, title, description], index) => (
              <article key={title} className="border border-hairline bg-background p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <Icon className="h-7 w-7 text-sage-deep" strokeWidth={1.3} />
                  <span className="font-display text-3xl text-taupe">0{index + 1}</span>
                </div>
                <h3 className="mt-8 font-display text-2xl">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-7 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Объём моделирования, число этапов и стоимость определим после обсуждения задачи. До
            начала работ согласуем состав проекта, цену и срок.
          </p>
        </div>
      </section>

      <section id="request" className="scroll-mt-20 bg-ink">
        <div className="container-page py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="label-caps text-sand/70">Заявка на разработку</p>
            <h2 className="display-md mt-4 text-sand">Расскажите, что хотите создать</h2>
            <p className="mt-5 text-sm leading-relaxed text-sand/75">
              Готовый чертёж не нужен. Опишите идею своими словами и приложите референсы, если они
              есть. Регистрация не требуется.
            </p>
          </div>
          {submitted ? (
            <div className="mt-10 max-w-2xl border border-sand/30 p-8 text-sand md:p-10">
              <Check className="h-8 w-8" strokeWidth={1.3} />
              <h3 className="mt-5 font-display text-4xl">Заявка получена</h3>
              <p className="mt-4 text-sm leading-relaxed text-sand/75">
                Менеджер изучит описание и файлы, затем свяжется с вами для обсуждения проекта.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFiles([]);
                }}
                className="mt-7 text-xs uppercase tracking-[0.15em] underline"
              >
                Отправить ещё одну заявку
              </button>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,.8fr)] lg:items-start"
            >
              <div className="space-y-8">
                <div className="border border-sand/25 p-6 md:p-8">
                  <p className="label-caps text-sand/60">01 · Идея</p>
                  <h3 className="mt-3 font-display text-3xl text-sand">Что нужно создать?</h3>
                  <label className="mt-6 block">
                    <span className="label-caps text-sand/70">Опишите задачу *</span>
                    <textarea
                      name="description"
                      required
                      minLength={10}
                      maxLength={5000}
                      rows={6}
                      placeholder="Для чего нужно изделие, как оно должно выглядеть и работать? Что для вас особенно важно?"
                      className="mt-2 w-full resize-y border border-sand/30 bg-transparent px-4 py-3 text-sm text-sand outline-none placeholder:text-sand/40 focus:border-sand"
                    />
                  </label>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Назначение"
                      name="purpose"
                      placeholder="Например, корпус для прибора"
                      maxLength={120}
                    />
                    <Field
                      label="Желаемое количество, шт."
                      name="quantity"
                      type="number"
                      min={1}
                      max={1000}
                      defaultValue={1}
                    />
                    <Field
                      label="Примерные габариты"
                      name="dimensions"
                      placeholder="Если известны"
                      maxLength={200}
                    />
                    <Field
                      label="Цвет / пожелания"
                      name="color"
                      placeholder="Материал, фактура, цвет"
                      maxLength={120}
                    />
                    <Field
                      label="Желаемый срок"
                      name="desiredDate"
                      placeholder="Если есть конкретная дата"
                      maxLength={80}
                    />
                  </div>
                </div>
                <div className="border border-sand/25 p-6 md:p-8">
                  <p className="label-caps text-sand/60">02 · Референсы</p>
                  <h3 className="mt-3 font-display text-3xl text-sand">
                    Покажите, что имеете в виду
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-sand/70">
                    Необязательно. Подойдут фото, рисунок, чертёж, PDF, ZIP или предварительная
                    3D-модель.
                  </p>
                  <label className="mt-6 flex cursor-pointer items-center gap-4 border border-dashed border-sand/45 p-5 text-sm text-sand hover:border-sand">
                    <FileUp className="h-6 w-6 shrink-0" strokeWidth={1.4} />
                    <span>
                      Выбрать файлы{" "}
                      <small className="mt-1 block text-sand/60">
                        До 3 файлов, каждый до 20 МБ
                      </small>
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".stl,.obj,.3mf,.step,.stp,.iges,.igs,.zip,.pdf,.png,.jpg,.jpeg,.webp"
                      onChange={(event) => {
                        chooseFiles(event.target.files);
                        event.target.value = "";
                      }}
                      className="sr-only"
                    />
                  </label>
                  {files.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 text-xs text-sand"
                        >
                          <span className="truncate">
                            {file.name} · {(file.size / 1024 / 1024).toFixed(1)} МБ
                          </span>
                          <button
                            type="button"
                            aria-label={`Убрать ${file.name}`}
                            onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="border border-sand/25 p-6 md:p-8">
                  <p className="label-caps text-sand/60">03 · Контакты</p>
                  <h3 className="mt-3 font-display text-3xl text-sand">Как с вами связаться?</h3>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Ваше имя *"
                      name="contactName"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={160}
                    />
                    <Field
                      label="Телефон *"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      aria-required="true"
                      maxLength={60}
                      inputRef={phoneInputRef}
                      error={phoneError}
                      onBlur={(event) =>
                        setPhoneError(
                          normalizeContactPhone(event.target.value) ? null : CONTACT_PHONE_ERROR,
                        )
                      }
                      onChange={(event) => {
                        if (phoneError && normalizeContactPhone(event.target.value))
                          setPhoneError(null);
                      }}
                    />
                    <Field
                      label="Email *"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                    />
                  </div>
                  <label className="mt-6 flex items-start gap-3 text-xs leading-relaxed text-sand/75">
                    <input
                      type="checkbox"
                      name="personalDataConsent"
                      required
                      className="mt-0.5 h-4 w-4 shrink-0 accent-sand"
                    />
                    <span>
                      Согласен на обработку персональных данных для ответа на заявку.{" "}
                      <Link to="/data" className="underline">
                        Текст согласия
                      </Link>
                    </span>
                  </label>
                  <div className="absolute -left-[10000px]" aria-hidden="true">
                    <label>
                      Сайт
                      <input name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="mt-7 inline-flex items-center gap-3 bg-sand px-8 py-4 text-xs font-medium uppercase tracking-[0.16em] text-ink disabled:opacity-50"
                  >
                    {sending ? "Отправляем…" : "Обсудить проект"} <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="mt-4 text-xs text-sand/55">
                    Без регистрации и оплаты. Мы свяжемся с вами, чтобы уточнить объём разработки.
                  </p>
                </div>
              </div>
              <aside className="border border-sand/25 p-6 text-sand lg:sticky lg:top-28 md:p-8">
                <p className="label-caps text-sand/70">Как формируется стоимость</p>
                <h3 className="mt-5 font-display text-3xl">Сначала разберём вашу задачу</h3>
                <p className="mt-5 text-sm leading-relaxed text-sand/70">
                  Цена зависит от сложности модели, требуемых согласований, прототипирования и
                  печати. После изучения заявки предложим план работ, стоимость и срок.
                </p>
                <div className="mt-7 border-t border-sand/25 pt-6">
                  <p className="text-sm text-sand/75">Уже есть готовый 3D-файл?</p>
                  <Link
                    to="/3d-printing"
                    className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] underline"
                  >
                    Рассчитать печать <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </aside>
            </form>
          )}
        </div>
      </section>
      <section className="container-page py-16 md:py-20">
        <div className="flex flex-col gap-5 border border-hairline p-7 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <p className="label-caps text-taupe">Проект для пространства или бизнеса?</p>
            <h2 className="mt-3 font-display text-3xl">
              Комплексные проекты — отдельное направление
            </h2>
          </div>
          <Link
            to="/business"
            className="inline-flex shrink-0 items-center gap-2 text-xs uppercase tracking-[0.16em] underline"
          >
            Для бизнеса <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  inputRef,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  inputRef?: Ref<HTMLInputElement>;
  error?: string | null;
}) {
  return (
    <label className="block">
      <span className="label-caps text-sand/70">{label}</span>
      <input
        {...props}
        ref={inputRef}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${props.name}-error` : undefined}
        className="mt-2 w-full border border-sand/30 bg-transparent px-4 py-3 text-sm text-sand outline-none placeholder:text-sand/40 focus:border-sand"
      />
      {error ? (
        <span id={`${props.name}-error`} role="alert" className="mt-2 block text-xs text-red-300">
          {error}
        </span>
      ) : null}
    </label>
  );
}

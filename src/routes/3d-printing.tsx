import { trackGoal } from "@/lib/analytics";
import { useEffect, useRef, useState, type FormEvent, type Ref } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, FileUp, Layers3, PackageCheck, X } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import {
  createCustomPrintInquiryFn,
  getCustomPrintOptionsFn,
  getCustomPrintQuoteFn,
} from "@/lib/custom-print-functions";
import { formatPrice } from "@/lib/format";
import { CONTACT_PHONE_ERROR, normalizeContactPhone } from "@/lib/contact-phone";

export const Route = createFileRoute("/3d-printing")({
  loader: () => getCustomPrintOptionsFn(),
  component: CustomPrintingPage,
});

function CustomPrintingPage() {
  const { materials } = Route.useLoaderData();
  const [materialId, setMaterialId] = useState("");
  const [estimatedGrams, setEstimatedGrams] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [quote, setQuote] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const grams = Number(estimatedGrams);
    if (!materialId || !grams || grams < 20 || grams > 20_000 || quantity < 1 || quantity > 1000) {
      setQuote(null);
      setQuoting(false);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    const timer = setTimeout(() => {
      getCustomPrintQuoteFn({ data: { materialId, estimatedGrams: grams, quantity } })
        .then((result) => {
          if (!cancelled) setQuote(result.price);
        })
        .catch(() => {
          if (!cancelled) setQuote(null);
        })
        .finally(() => {
          if (!cancelled) setQuoting(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [materialId, estimatedGrams, quantity]);

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
    const allowed = /\.(stl|obj|3mf|step|stp|iges|igs)$/i;
    if (next.some((file) => !allowed.test(file.name))) {
      toast.error("Загрузите 3D-модель в формате STL, OBJ, 3MF, STEP или IGES.");
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
    if (!files.some((file) => /\.(stl|obj|3mf|step|stp|iges|igs)$/i.test(file.name))) {
      toast.error(
        "Добавьте готовую 3D-модель. Если её нет, перейдите на страницу разработки изделия.",
      );
      return;
    }
    form.set("phone", phone);
    form.set("modelStatus", "ready");
    form.set("description", "Печать по готовой 3D-модели.");
    form.set("materialId", materialId);
    form.set("quantity", String(quantity));
    form.set("estimatedGrams", estimatedGrams);
    form.delete("files");
    files.forEach((file) => form.append("files", file));
    setSending(true);
    try {
      await createCustomPrintInquiryFn({ data: form });
      setSubmitted(true);
      trackGoal("generate_lead", { form: "3d-printing" });
      toast.success("Заявка отправлена");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отправить заявку.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <section className="container-page pt-10 pb-12 md:pt-14 md:pb-16">
        <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "3D-печать на заказ" }]} />
        <div className="mt-9 max-w-4xl">
          <p className="label-caps text-taupe">NOIR ATELIER · Цифровое производство</p>
          <h1 className="display-xl mt-5 text-foreground">
            Ваша модель.
            <br />
            <em>Реальный предмет.</em>
          </h1>
          <p className="prose-noir mt-7 max-w-2xl">
            Загрузите готовую 3D-модель, получите предварительный расчёт и оставьте контакты.
            Менеджер свяжется с вами, чтобы согласовать параметры печати, сроки и доставку.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#request"
              className="inline-flex items-center gap-3 bg-ink px-7 py-4 text-xs font-medium uppercase tracking-[0.16em] text-sand"
            >
              Рассчитать и отправить заявку <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Выберите услугу">
            <span className="border border-ink bg-ink px-5 py-4 text-xs uppercase tracking-[0.12em] text-sand">
              Есть 3D-модель · печать
            </span>
            <Link
              to="/3d-design"
              className="border border-hairline px-5 py-4 text-xs uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
            >
              Есть идея или эскиз · разработка <ArrowRight className="ml-2 inline h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>
      <section id="request" className="scroll-mt-20 border-t border-hairline bg-ink">
        <div className="container-page py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="label-caps text-sand/70">Расчёт и заявка</p>
            <h2 className="display-md mt-4 text-sand">Загрузите модель и оставьте контакты</h2>
            <p className="mt-5 text-sm leading-relaxed text-sand/75">
              Загрузите готовую 3D-модель. Если вес пока неизвестен, оставьте это поле пустым —
              специалист проверит файл и уточнит расход.
            </p>
          </div>
          {submitted ? (
            <div className="mt-10 max-w-2xl border border-sand/30 p-8 text-sand md:p-10">
              <Check className="h-8 w-8" strokeWidth={1.3} />
              <h3 className="mt-5 font-display text-4xl">Заявка получена</h3>
              <p className="mt-4 text-sm leading-relaxed text-sand/75">
                Менеджер проверит модель и свяжется с вами, чтобы согласовать параметры печати,
                стоимость, сроки и доставку.
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
              <div className="contents lg:block lg:space-y-8">
                <div className="order-1 border border-sand/25 p-6 md:p-8">
                  <p className="label-caps text-sand/60">01 · Файл модели</p>
                  <h3 className="mt-3 font-display text-3xl text-sand">Загрузите 3D-модель *</h3>
                  <p className="mt-3 text-sm leading-relaxed text-sand/70">
                    Подойдут STL, OBJ, 3MF, STEP, STP, IGES или IGS.
                  </p>
                  <p className="mt-3 text-sm text-sand/70">
                    Модели пока нет?{" "}
                    <Link to="/3d-design" className="underline">
                      Расскажите об идее на странице разработки.
                    </Link>
                  </p>
                  <label className="mt-6 flex cursor-pointer items-center gap-4 border border-dashed border-sand/45 p-5 text-sm text-sand hover:border-sand">
                    <FileUp className="h-6 w-6 shrink-0" strokeWidth={1.4} />
                    <span>
                      Выбрать файлы модели{" "}
                      <small className="mt-1 block text-sand/60">
                        До 3 файлов, каждый до 20 МБ
                      </small>
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".stl,.obj,.3mf,.step,.stp,.iges,.igs"
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

                <div className="order-3 border border-sand/25 p-6 lg:order-none md:p-8">
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
                    {sending ? "Отправляем…" : "Отправить заявку"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="mt-4 text-xs text-sand/55">
                    Без регистрации и оплаты. Менеджер уточнит параметры печати, стоимость, сроки и
                    доставку.
                  </p>
                </div>
              </div>

              <aside className="order-2 border border-sand/25 p-6 text-sand lg:sticky lg:top-28 lg:order-none md:p-8">
                <div className="flex items-center gap-3">
                  <Layers3 className="h-5 w-5" strokeWidth={1.4} />
                  <p className="label-caps text-sand/70">02 · Калькулятор</p>
                </div>
                <label className="mt-7 block">
                  <span className="label-caps text-sand/70">Материал</span>
                  <select
                    value={materialId}
                    onChange={(event) => setMaterialId(event.target.value)}
                    className="mt-2 w-full border border-sand/30 bg-ink px-4 py-3 text-sm text-sand outline-none focus:border-sand"
                  >
                    <option value="">Помогите выбрать</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </select>
                </label>
                {materialId ? (
                  <p className="mt-2 text-xs leading-relaxed text-sand/60">
                    {materials.find((material) => material.id === materialId)?.description}
                  </p>
                ) : null}
                <label className="mt-6 block">
                  <span className="label-caps text-sand/70">Количество, шт.</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    required
                    className="mt-2 w-full border border-sand/30 bg-transparent px-4 py-3 text-sm text-sand outline-none focus:border-sand"
                  />
                </label>
                <label className="mt-6 block">
                  <span className="label-caps text-sand/70">Примерный расход на 1 изделие, г</span>
                  <input
                    type="number"
                    min={20}
                    max={20000}
                    step={1}
                    value={estimatedGrams}
                    onChange={(event) => setEstimatedGrams(event.target.value)}
                    placeholder="Если известен"
                    className="mt-2 w-full border border-sand/30 bg-transparent px-4 py-3 text-sm text-sand outline-none placeholder:text-sand/40 focus:border-sand"
                  />
                </label>
                <p className="mt-3 text-xs leading-relaxed text-sand/60">
                  Не знаете вес? Оставьте поле пустым — специалист определит расход после проверки
                  модели.
                </p>
                <div className="mt-7 border-t border-sand/25 pt-6" aria-live="polite">
                  <p className="label-caps text-sand/65">Минимальная прикидка</p>
                  <p className="mt-3 font-display text-4xl">
                    {quoting
                      ? "Считаем…"
                      : quote !== null
                        ? `от ${formatPrice(quote)}`
                        : "После проверки"}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-sand/60">
                    Нижняя оценка по материалу, примерному весу и количеству. Это не цена заказа:
                    работу, точный расход, сроки и доставку менеджер оценит после проверки модели.
                  </p>
                </div>
              </aside>
            </form>
          )}
        </div>
      </section>

      <section className="border-y border-hairline bg-surface">
        <div className="container-page py-14 md:py-20">
          <p className="label-caps text-taupe">Что будет дальше</p>
          <h2 className="display-md mt-4">Три простых шага</h2>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              [FileUp, "Загрузите модель", "Прикрепите готовый 3D-файл и оставьте контакты."],
              [
                Layers3,
                "Посмотрите расчёт",
                "Выберите материал и количество. Если знаете примерный вес, калькулятор покажет ориентир по цене.",
              ],
              [
                PackageCheck,
                "Согласуем детали",
                "Менеджер свяжется с вами, чтобы уточнить параметры печати, стоимость, сроки и доставку.",
              ],
            ].map(([Icon, title, description], index) => {
              const StepIcon = Icon as typeof FileUp;
              return (
                <article
                  key={String(title)}
                  className="border border-hairline bg-background p-6 md:p-8"
                >
                  <div className="flex items-center justify-between">
                    <StepIcon className="h-6 w-6 text-sage-deep" strokeWidth={1.3} />
                    <span className="font-display text-3xl text-taupe">0{index + 1}</span>
                  </div>
                  <h3 className="mt-7 font-display text-2xl">{String(title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {String(description)}
                  </p>
                </article>
              );
            })}
          </div>
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
}: React.InputHTMLAttributes<HTMLInputElement> & {
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

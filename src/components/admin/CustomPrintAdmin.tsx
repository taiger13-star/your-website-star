import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  downloadCustomPrintFileFn,
  getAdminCustomPrintStateFn,
  saveCustomPrintMaterialFn,
  saveCustomPrintSettingsFn,
  updateCustomPrintInquiryStatusFn,
} from "@/lib/custom-print-functions";
import { formatPrice } from "@/lib/format";

type AdminState = Awaited<ReturnType<typeof getAdminCustomPrintStateFn>>;
type Material = AdminState["materials"][number];

const inputClass = "mt-1 w-full border border-hairline bg-background px-3 py-2 text-sm";

export function CustomPrintAdmin() {
  const [data, setData] = useState<AdminState | null>(null);
  const [loading, setLoading] = useState(true);
  const [inquiryFilter, setInquiryFilter] = useState<"print" | "design" | "all">("print");
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [creatingMaterial, setCreatingMaterial] = useState(false);
  const refresh = async () => {
    const state = await getAdminCustomPrintStateFn();
    setData(state);
  };
  useEffect(() => {
    refresh()
      .catch(() => toast.error("Не удалось загрузить данные 3D-печати."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-8 text-sm">Загрузка…</p>;
  if (!data) return <p className="py-8 text-sm">Не удалось загрузить данные.</p>;

  return (
    <section className="space-y-12 py-8">
      <div>
        <p className="label-caps text-taupe">3D-печать на заказ</p>
        <h2 className="display-md mt-2">Материалы и расчёт</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Клиентская минимальная прикидка считается отдельно по материалу и весу. Ставки и
          коэффициенты ниже нужны для внутренней оценки работы и не влияют на сумму для клиента.
        </p>
      </div>
      <SettingsForm
        key={JSON.stringify(data.settings)}
        settings={data.settings}
        refresh={refresh}
      />
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="font-display text-3xl">Материалы</h3>
          <button
            type="button"
            onClick={() => {
              setEditingMaterialId(null);
              setCreatingMaterial((current) => !current);
            }}
            aria-expanded={creatingMaterial}
            className="bg-ink px-5 py-3 text-xs uppercase tracking-[0.14em] text-sand"
          >
            {creatingMaterial ? "Закрыть форму" : "Добавить материал"}
          </button>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          Добавьте материал и цену за килограмм. Отключённый материал исчезнет из формы клиента, но
          сохранится в старых заявках.
        </p>
        <div className="mt-6 divide-y divide-hairline border border-hairline bg-background">
          {!data.materials.length ? (
            <p className="p-5 text-sm text-ink-soft">Материалы пока не добавлены.</p>
          ) : null}
          {data.materials.map((material) => (
            <div key={material.id}>
              <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="font-display text-2xl">{material.name}</h4>
                    <span
                      className={`px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${material.active ? "bg-secondary text-ink" : "bg-surface text-taupe"}`}
                    >
                      {material.active ? "Доступен клиентам" : "Скрыт для клиентов"}
                    </span>
                  </div>
                  {material.description ? (
                    <p className="mt-1 text-sm text-ink-soft">{material.description}</p>
                  ) : null}
                </div>
                <div className="text-sm sm:text-right">
                  <p className="font-medium text-ink">{formatPrice(material.priceRubKg)} / кг</p>
                  <p className="mt-1 text-xs text-taupe">Порядок: {material.sortOrder}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingMaterial(false);
                    setEditingMaterialId((current) =>
                      current === material.id ? null : material.id,
                    );
                  }}
                  aria-expanded={editingMaterialId === material.id}
                  className="w-fit border border-ink px-4 py-2 text-xs uppercase tracking-[0.12em] sm:col-start-2 md:col-auto"
                >
                  {editingMaterialId === material.id ? "Закрыть" : "Изменить"}
                </button>
              </div>
              {editingMaterialId === material.id ? (
                <MaterialForm
                  material={material}
                  refresh={refresh}
                  onSaved={() => setEditingMaterialId(null)}
                  onCancel={() => setEditingMaterialId(null)}
                />
              ) : null}
            </div>
          ))}
        </div>
        {creatingMaterial ? (
          <div className="mt-5 max-w-3xl">
            <MaterialForm
              refresh={refresh}
              defaultSortOrder={Math.max(-1, ...data.materials.map((item) => item.sortOrder)) + 1}
              onSaved={() => setCreatingMaterial(false)}
              onCancel={() => setCreatingMaterial(false)}
            />
          </div>
        ) : null}
      </div>
      <div>
        <p className="label-caps text-taupe">Входящие запросы</p>
        <h3 className="mt-2 font-display text-3xl">Заявки на печать и разработку</h3>
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Тип заявки">
          {(
            [
              ["print", "Печать по модели"],
              ["design", "Разработка изделия"],
              ["all", "Все заявки"],
            ] as const
          ).map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              aria-pressed={inquiryFilter === filter}
              onClick={() => setInquiryFilter(filter)}
              className={`border px-4 py-2 text-xs uppercase tracking-[0.1em] ${inquiryFilter === filter ? "border-ink bg-ink text-sand" : "border-hairline text-ink"}`}
            >
              {label} ·{" "}
              {
                data.inquiries.filter(
                  (inquiry) =>
                    filter === "all" ||
                    (filter === "print"
                      ? inquiry.modelStatus === "ready"
                      : inquiry.modelStatus !== "ready"),
                ).length
              }
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          {data.inquiries.some(
            (inquiry) =>
              inquiryFilter === "all" ||
              (inquiryFilter === "print"
                ? inquiry.modelStatus === "ready"
                : inquiry.modelStatus !== "ready"),
          ) ? (
            data.inquiries
              .filter(
                (inquiry) =>
                  inquiryFilter === "all" ||
                  (inquiryFilter === "print"
                    ? inquiry.modelStatus === "ready"
                    : inquiry.modelStatus !== "ready"),
              )
              .map((inquiry) => (
                <InquiryCard key={inquiry.id} inquiry={inquiry} refresh={refresh} />
              ))
          ) : (
            <p className="border border-hairline bg-background p-6 text-sm text-ink-soft">
              В этом разделе пока нет заявок.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function SettingsForm({
  settings,
  refresh,
}: {
  settings: AdminState["settings"];
  refresh: () => Promise<void>;
}) {
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await saveCustomPrintSettingsFn({
        data: {
          estimatesEnabled: settings.estimatesEnabled,
          machineRubHour: Number(form.get("machineRubHour")),
          laborRubHour: Number(form.get("laborRubHour")),
          gramsPerHour: Number(form.get("gramsPerHour")),
          setupFeeRub: Number(form.get("setupFeeRub")),
          wastePercent: Number(form.get("wastePercent")),
          markupPercent: Number(form.get("markupPercent")),
          minimumOrderRub: Number(form.get("minimumOrderRub")),
        },
      });
      await refresh();
      toast.success("Параметры расчёта сохранены");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить параметры.");
    }
  };
  const fields: { key: keyof typeof settings; label: string; min?: number; max?: number }[] = [
    { key: "machineRubHour", label: "Работа принтера, ₽/ч" },
    { key: "laborRubHour", label: "Работа специалиста, ₽/ч" },
    { key: "gramsPerHour", label: "Средний расход, г/ч", min: 1, max: 1000 },
    { key: "setupFeeRub", label: "Подготовка заказа, ₽" },
    { key: "wastePercent", label: "Потери материала, %", max: 100 },
    { key: "markupPercent", label: "Наценка, %", max: 1000 },
    { key: "minimumOrderRub", label: "Минимальная сумма заказа, ₽" },
  ];
  return (
    <form onSubmit={save} className="border border-hairline bg-background p-6 md:p-8">
      <h3 className="font-display text-3xl">Параметры внутренней оценки</h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((field) => (
          <label key={field.key} className="text-xs text-ink-soft">
            {field.label}
            <input
              className={inputClass}
              type="number"
              name={field.key}
              min={field.min ?? 0}
              max={field.max ?? 1000000}
              step={1}
              defaultValue={Number(settings[field.key])}
              required
            />
          </label>
        ))}
      </div>
      <button
        type="submit"
        className="mt-6 bg-ink px-6 py-3 text-xs uppercase tracking-[0.14em] text-sand"
      >
        Сохранить параметры
      </button>
    </form>
  );
}

function MaterialForm({
  material,
  refresh,
  defaultSortOrder = 0,
  onSaved,
  onCancel,
}: {
  material?: Material;
  refresh: () => Promise<void>;
  defaultSortOrder?: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await saveCustomPrintMaterialFn({
        data: {
          ...(material ? { id: material.id } : {}),
          name: String(form.get("name") ?? ""),
          description: String(form.get("description") ?? ""),
          priceRubKg: Number(form.get("priceRubKg")),
          active: form.get("active") === "on",
          sortOrder: Number(form.get("sortOrder")),
        },
      });
      await refresh();
      toast.success(material ? "Материал обновлён" : "Материал добавлен");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить материал.");
    }
  };
  return (
    <form
      onSubmit={save}
      autoComplete="off"
      className={
        material
          ? "border-t border-hairline bg-surface p-5"
          : "border border-hairline bg-surface p-5"
      }
    >
      <p className="label-caps text-taupe">
        {material ? `Редактирование · ${material.name}` : "Новый материал"}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-ink-soft">
          Название
          <input
            name="name"
            className={inputClass}
            defaultValue={material?.name ?? ""}
            maxLength={120}
            required
            placeholder="PLA, PETG, TPU…"
          />
        </label>
        <label className="text-xs text-ink-soft">
          Себестоимость, ₽/кг
          <input
            name="priceRubKg"
            type="number"
            min={0}
            max={1000000}
            step={1}
            className={inputClass}
            defaultValue={material?.priceRubKg ?? ""}
            required
          />
        </label>
        <label className="text-xs text-ink-soft sm:col-span-2">
          Описание для клиента
          <input
            name="description"
            className={inputClass}
            defaultValue={material?.description ?? ""}
            maxLength={1000}
            placeholder="Кратко: свойства и подходящие задачи"
          />
        </label>
        <label className="text-xs text-ink-soft">
          Порядок
          <input
            name="sortOrder"
            type="number"
            min={0}
            max={1000}
            className={inputClass}
            defaultValue={material?.sortOrder ?? defaultSortOrder}
            required
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-xs text-ink-soft">
          <input
            name="active"
            type="checkbox"
            defaultChecked={material?.active ?? true}
            className="h-4 w-4 accent-ink"
          />
          Доступен клиентам
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          className="bg-ink px-5 py-2 text-xs uppercase tracking-[0.14em] text-sand"
        >
          {material ? "Сохранить изменения" : "Добавить"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-xs uppercase tracking-[0.14em] underline"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

function InquiryCard({
  inquiry,
  refresh,
}: {
  inquiry: AdminState["inquiries"][number];
  refresh: () => Promise<void>;
}) {
  const download = async (id: string) => {
    try {
      const { fileName, base64 } = await downloadCustomPrintFileFn({ data: { id } });
      const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось скачать файл.");
    }
  };
  const setStatus = async (status: "new" | "in_progress" | "answered" | "closed") => {
    try {
      await updateCustomPrintInquiryStatusFn({ data: { id: inquiry.id, status } });
      await refresh();
      toast.success("Статус обновлён");
    } catch {
      toast.error("Не удалось изменить статус.");
    }
  };
  return (
    <article className="border border-hairline bg-background p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-caps text-taupe">
            {new Date(inquiry.createdAt).toLocaleString("ru-RU")}
          </p>
          <h4 className="mt-2 font-display text-2xl">{inquiry.contactName}</h4>
          <p className="mt-1 text-xs uppercase tracking-[0.1em] text-taupe">
            {inquiry.modelStatus === "ready" ? "Печать по готовой модели" : "Разработка изделия"}
          </p>
          <p className="mt-1 text-sm">
            <a href={`tel:${inquiry.phone}`} className="underline">
              {inquiry.phone}
            </a>{" "}
            ·{" "}
            <a href={`mailto:${inquiry.email}`} className="underline">
              {inquiry.email}
            </a>
          </p>
        </div>
        <select
          value={inquiry.status}
          onChange={(event) =>
            setStatus(event.target.value as "new" | "in_progress" | "answered" | "closed")
          }
          className="border border-hairline bg-background px-3 py-2 text-sm"
        >
          <option value="new">Новая</option>
          <option value="in_progress">В работе</option>
          <option value="answered">Ответили</option>
          <option value="closed">Закрыта</option>
        </select>
      </div>
      <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed">{inquiry.description}</p>
      <dl className="mt-5 grid gap-3 border-t border-hairline pt-5 text-xs sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-taupe">Модель</dt>
          <dd className="mt-1">
            {inquiry.modelStatus === "ready"
              ? "Есть файл"
              : inquiry.modelStatus === "need-modeling"
                ? "Нужно моделирование"
                : "Нужна помощь"}
          </dd>
        </div>
        <div>
          <dt className="text-taupe">Материал</dt>
          <dd className="mt-1">{inquiry.materialName ?? "Подобрать"}</dd>
        </div>
        <div>
          <dt className="text-taupe">Количество / расход</dt>
          <dd className="mt-1">
            {inquiry.quantity} шт. /{" "}
            {inquiry.estimatedGrams ? `${inquiry.estimatedGrams} г` : "не указан"}
          </dd>
        </div>
        {inquiry.purpose ? (
          <div>
            <dt className="text-taupe">Назначение</dt>
            <dd className="mt-1">{inquiry.purpose}</dd>
          </div>
        ) : null}
        {inquiry.dimensions ? (
          <div>
            <dt className="text-taupe">Габариты</dt>
            <dd className="mt-1">{inquiry.dimensions}</dd>
          </div>
        ) : null}
        {inquiry.color ? (
          <div>
            <dt className="text-taupe">Цвет</dt>
            <dd className="mt-1">{inquiry.color}</dd>
          </div>
        ) : null}
        {inquiry.desiredDate ? (
          <div>
            <dt className="text-taupe">Срок</dt>
            <dd className="mt-1">{inquiry.desiredDate}</dd>
          </div>
        ) : null}
      </dl>
      {inquiry.files.length ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-hairline pt-5">
          {inquiry.files.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => download(file.id)}
              className="border border-hairline px-3 py-2 text-xs underline"
            >
              Скачать {file.fileName} · {(file.byteSize / 1024 / 1024).toFixed(1)} МБ
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

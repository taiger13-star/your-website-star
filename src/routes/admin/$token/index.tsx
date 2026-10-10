/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useState } from "react";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  deleteCollectionFn,
  deleteMediaFn,
  deleteProductFn,
  deleteReferenceFn,
  getAdminStateFn,
  loginAdminFn,
  logoutAdminFn,
  saveCollectionFn,
  saveProductFn,
  saveReferenceFn,
  updateOrderStatusFn,
  uploadMediaFn,
} from "@/lib/server-functions";

export const Route = createFileRoute("/admin/$token/")({
  loader: async ({ params }) => {
    const state = await getAdminStateFn({ data: { token: params.token } });
    if (!state.validRoute) throw notFound();
    return state;
  },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { title: "Управление — NOIR ATELIER" },
    ],
  }),
  component: AdminPage,
});

type Tab = "products" | "collections" | "references" | "media" | "orders";

function AdminPage() {
  const state = Route.useLoaderData();
  const { token } = Route.useParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("products");
  const refresh = () => void router.invalidate();
  if (!state.authenticated || !state.data) return <Login token={token} onDone={refresh} />;
  const data = state.data;
  const logout = async () => {
    await logoutAdminFn();
    refresh();
  };
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-hairline bg-background">
        <div className="container-page flex items-center justify-between py-5">
          <div>
            <p className="label-caps text-taupe">NOIR ATELIER</p>
            <h1 className="font-display text-2xl">Управление каталогом</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs uppercase tracking-[0.16em] underline"
          >
            Выйти
          </button>
        </div>
      </header>
      <main className="container-page py-8">
        <nav className="flex flex-wrap gap-2 border-b border-hairline pb-5">
          {(
            [
              ["products", "Товары"],
              ["collections", "Коллекции"],
              ["references", "Параметры"],
              ["media", "Фото"],
              ["orders", "Заказы"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-xs uppercase tracking-[0.14em] ${tab === id ? "bg-ink text-primary-foreground" : "border border-hairline"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        {tab === "products" ? <Products data={data} refresh={refresh} /> : null}
        {tab === "collections" ? <Collections data={data} refresh={refresh} /> : null}
        {tab === "references" ? <References data={data} refresh={refresh} /> : null}
        {tab === "media" ? <Media data={data} refresh={refresh} /> : null}
        {tab === "orders" ? <Orders data={data} refresh={refresh} /> : null}
      </main>
    </div>
  );
}

function Login({ token, onDone }: { token: string; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    try {
      const password = String(new FormData(event.currentTarget).get("password") ?? "");
      await loginAdminFn({ data: { token, password } });
      onDone();
    } catch {
      toast.error("Неверный пароль");
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="container-page flex min-h-screen items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm border border-hairline bg-background p-7">
        <p className="label-caps text-taupe">Закрытый раздел</p>
        <h1 className="display-md mt-3">Вход в управление</h1>
        <label className="mt-6 block text-sm">
          Пароль
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2 w-full border border-hairline bg-background px-3 py-2.5"
          />
        </label>
        <button
          disabled={pending}
          className="mt-5 w-full bg-ink px-5 py-3 text-xs uppercase tracking-[0.16em] text-primary-foreground"
        >
          {pending ? "Проверяем…" : "Войти"}
        </button>
      </form>
    </div>
  );
}

function Products({ data, refresh }: { data: any; refresh: () => void }) {
  const [editing, setEditing] = useState<any | null>(null);
  const remove = async (id: string) => {
    if (!confirm("Удалить товар?")) return;
    try {
      await deleteProductFn({ data: { id } });
      toast.success("Товар удалён");
      refresh();
    } catch {
      toast.error("Не удалось удалить товар");
    }
  };
  return (
    <section className="py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="label-caps text-taupe">Ассортимент</p>
          <h2 className="display-md mt-2">Товары</h2>
        </div>
        <button
          onClick={() =>
            setEditing({
              publicationStatus: "draft",
              category: "decor",
              variants: [
                {
                  sizeCode: "M",
                  system: "standard",
                  price: 0,
                  productionDays: 7,
                  enabled: true,
                  packageLengthCm: null,
                  packageWidthCm: null,
                  packageHeightCm: null,
                  packageWeightGrams: null,
                  measurements: { outerHeightMm: 160, scaleReference: "plant" },
                },
              ],
              specifications: [],
              colorIds: [],
              materialNames: [],
              mediaIds: [],
              isNew: false,
              isBestseller: false,
              isComingSoon: false,
              featured: false,
            })
          }
          className="bg-ink px-5 py-3 text-xs uppercase tracking-[0.14em] text-primary-foreground"
        >
          Новый товар
        </button>
      </div>
      {editing ? (
        <ProductForm
          item={editing}
          data={data}
          onDone={() => {
            setEditing(null);
            refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div className="mt-7 overflow-x-auto border border-hairline bg-background">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-hairline text-xs uppercase text-taupe">
              <tr>
                <th className="p-3">Товар</th>
                <th>Коллекция</th>
                <th>Статус</th>
                <th>Варианты</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.products.map((item: any) => (
                <tr key={item.id} className="border-b border-hairline last:border-0">
                  <td className="p-3">
                    <strong>{item.name}</strong>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                  </td>
                  <td>{item.collectionName}</td>
                  <td>{item.publicationStatus}</td>
                  <td>{item.variants.length}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditing(item)} className="underline">
                      Изменить
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="ml-4 text-destructive underline"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ProductForm({
  item,
  data,
  onDone,
  onCancel,
}: {
  item: any;
  data: any;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [mediaIds, setMediaIds] = useState<string[]>(item.mediaIds ?? []);
  const [variants, setVariants] = useState(() =>
    (item.variants ?? []).map((variant: any) => ({
      ...variant,
      measurements: item.measurements?.find(
        (measurement: any) => measurement.variantId === variant.id,
      ) ?? { outerHeightMm: null, scaleReference: "plant" },
    })),
  );
  const [specifications, setSpecifications] = useState<any[]>(item.specifications ?? []);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await saveProductFn({
        data: {
          id: item.id,
          slug: String(form.get("slug")),
          sku: String(form.get("sku")),
          collectionId: String(form.get("collectionId")) || null,
          category: String(form.get("category")),
          form: String(form.get("form")),
          name: String(form.get("name")),
          shortDescription: String(form.get("shortDescription")),
          description: String(form.get("description")),
          publicationStatus: String(form.get("publicationStatus")) as
            "draft" | "published" | "hidden",
          isNew: form.get("isNew") === "on",
          isBestseller: form.get("isBestseller") === "on",
          isComingSoon: form.get("isComingSoon") === "on",
          featured: form.get("featured") === "on",
          colorIds: form.getAll("colorIds").map(String),
          materialNames: String(form.get("materials") ?? "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          mediaIds,
          variants,
          specifications,
        },
      });
      toast.success("Товар сохранён");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить товар");
    } finally {
      setPending(false);
    }
  };
  return (
    <form onSubmit={submit} className="mt-7 grid gap-5 border border-hairline bg-background p-5">
      <div className="flex justify-between">
        <h3 className="font-display text-2xl">
          {item.id ? "Редактирование товара" : "Новый товар"}
        </h3>
        <button type="button" onClick={onCancel} className="underline">
          Закрыть
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="name" label="Название" defaultValue={item.name} required />
        <Field name="slug" label="Slug (латиницей)" defaultValue={item.slug} required />
        <Field name="sku" label="SKU" defaultValue={item.sku} required />
        <Field name="category" label="Категория" defaultValue={item.category} required />
        <Field name="form" label="Форма" defaultValue={item.form} />
        <label className="text-sm">
          Коллекция
          <select
            name="collectionId"
            defaultValue={item.collectionId ?? ""}
            className="mt-1 w-full border border-hairline bg-background p-2"
          >
            <option value="">Без коллекции</option>
            {data.collections.map((collection: any) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Публикация
          <select
            name="publicationStatus"
            defaultValue={item.publicationStatus}
            className="mt-1 w-full border border-hairline bg-background p-2"
          >
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
            <option value="hidden">Скрыт</option>
          </select>
        </label>
      </div>
      <label className="text-sm">
        Краткое описание
        <textarea
          name="shortDescription"
          defaultValue={item.shortDescription}
          required
          className="mt-1 min-h-20 w-full border border-hairline bg-background p-2"
        />
      </label>
      <label className="text-sm">
        Полное описание
        <textarea
          name="description"
          defaultValue={item.description}
          required
          className="mt-1 min-h-28 w-full border border-hairline bg-background p-2"
        />
      </label>
      <div className="flex flex-wrap gap-4 text-sm">
        {[
          ["isNew", "Новинка"],
          ["isBestseller", "Хит"],
          ["isComingSoon", "Скоро"],
          ["featured", "На главной"],
        ].map(([name, label]) => (
          <label key={name}>
            <input name={name} type="checkbox" defaultChecked={item[name]} className="mr-2" />
            {label}
          </label>
        ))}
      </div>
      <fieldset>
        <legend className="text-sm">Доступные цвета</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {data.colors.map((color: any) => (
            <label key={color.id} className="text-sm">
              <input
                name="colorIds"
                type="checkbox"
                value={color.id}
                defaultChecked={item.colorIds?.includes(color.id)}
                className="mr-1"
              />
              {color.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field
        name="materials"
        label="Материалы через запятую"
        defaultValue={(item.materialNames ?? []).join(", ")}
      />
      <VariantEditor data={data} variants={variants} onChange={setVariants} />
      <SpecificationEditor
        variants={variants}
        items={specifications}
        onChange={setSpecifications}
      />
      <MediaPicker data={data} selected={mediaIds} onChange={setMediaIds} />
      <button
        disabled={pending}
        className="w-fit bg-ink px-5 py-3 text-xs uppercase tracking-[0.14em] text-primary-foreground"
      >
        {pending ? "Сохраняем…" : "Сохранить товар"}
      </button>
    </form>
  );
}

const measurementFields = [
  ["outerDiameterMm", "Внешний Ø, мм"],
  ["outerWidthMm", "Внешняя ширина, мм"],
  ["outerDepthMm", "Внешняя глубина, мм"],
  ["outerHeightMm", "Высота, мм"],
  ["innerDiameterMm", "Посадочный Ø, мм"],
  ["innerHeightMm", "Посадочная высота, мм"],
  ["plantingVolumeMl", "Объём, мл"],
  ["reservoirVolumeMl", "Резервуар, мл"],
  ["weightGrams", "Вес, г"],
] as const;

function VariantEditor({
  data,
  variants,
  onChange,
}: {
  data: any;
  variants: any[];
  onChange: (value: any[]) => void;
}) {
  const update = (index: number, patch: any) =>
    onChange(
      variants.map((variant, itemIndex) =>
        itemIndex === index ? { ...variant, ...patch } : variant,
      ),
    );
  const updateMeasurement = (index: number, field: string, value: string) => {
    const number = value === "" ? null : Number(value);
    update(index, { measurements: { ...variants[index].measurements, [field]: number } });
  };
  return (
    <fieldset>
      <div className="flex items-center justify-between">
        <legend className="text-sm">Варианты и размеры</legend>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...variants,
              {
                sizeCode: "M",
                system: "standard",
                price: 0,
                productionDays: 7,
                enabled: true,
                packageLengthCm: null,
                packageWidthCm: null,
                packageHeightCm: null,
                packageWeightGrams: null,
                measurements: { outerHeightMm: null, scaleReference: "plant" },
              },
            ])
          }
          className="text-xs underline"
        >
          Добавить вариант
        </button>
      </div>
      <div className="mt-3 space-y-4">
        {variants.map((variant, index) => (
          <article
            key={`${variant.id ?? "new"}-${index}`}
            className="border border-hairline bg-surface p-4"
          >
            <div className="grid gap-3 md:grid-cols-5">
              <label className="text-xs">
                Размер
                <select
                  value={variant.sizeCode}
                  onChange={(event) => update(index, { sizeCode: event.target.value })}
                  className="mt-1 w-full border border-hairline bg-background p-2 text-sm"
                >
                  {data.sizes.map((size: any) => (
                    <option key={size.code} value={size.code}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                Исполнение
                <select
                  value={variant.system}
                  onChange={(event) => update(index, { system: event.target.value })}
                  className="mt-1 w-full border border-hairline bg-background p-2 text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="smart">NOIR SMART</option>
                </select>
              </label>
              <label className="text-xs">
                Цена, ₽
                <input
                  type="number"
                  min="0"
                  value={variant.price}
                  onChange={(event) => update(index, { price: Number(event.target.value) })}
                  className="mt-1 w-full border border-hairline bg-background p-2 text-sm"
                />
              </label>
              <label className="text-xs">
                Срок, дней
                <input
                  type="number"
                  min="0"
                  value={variant.productionDays}
                  onChange={(event) =>
                    update(index, { productionDays: Number(event.target.value) })
                  }
                  className="mt-1 w-full border border-hairline bg-background p-2 text-sm"
                />
              </label>
              <div className="flex items-end justify-between gap-2 text-xs">
                <label className="pb-2">
                  <input
                    type="checkbox"
                    checked={variant.enabled}
                    onChange={(event) => update(index, { enabled: event.target.checked })}
                    className="mr-1"
                  />
                  Доступен
                </label>
                <button
                  type="button"
                  disabled={variants.length === 1}
                  onClick={() => onChange(variants.filter((_, itemIndex) => itemIndex !== index))}
                  className="pb-2 text-destructive underline disabled:opacity-30"
                >
                  Удалить
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {measurementFields.map(([field, label]) => (
                <label key={field} className="text-xs">
                  {label}
                  <input
                    type="number"
                    min="1"
                    value={variant.measurements?.[field] ?? ""}
                    onChange={(event) => updateMeasurement(index, field, event.target.value)}
                    className="mt-1 w-full border border-hairline bg-background p-2 text-sm"
                  />
                </label>
              ))}
              <label className="text-xs">
                Шкала масштаба
                <select
                  value={variant.measurements?.scaleReference ?? "plant"}
                  onChange={(event) =>
                    update(index, {
                      measurements: { ...variant.measurements, scaleReference: event.target.value },
                    })
                  }
                  className="mt-1 w-full border border-hairline bg-background p-2 text-sm"
                >
                  <option value="plant">Растение</option>
                  <option value="person">Человек</option>
                  <option value="interior">Интерьер</option>
                  <option value="none">Не показывать</option>
                </select>
              </label>
            </div>
            <div className="mt-4 border-t border-hairline pt-4">
              <p className="text-xs text-taupe">Упаковка для расчёта СДЭК</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-4">
                {(
                  [
                    ["packageLengthCm", "Длина, см"],
                    ["packageWidthCm", "Ширина, см"],
                    ["packageHeightCm", "Высота, см"],
                    ["packageWeightGrams", "Вес, г"],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="text-xs">
                    {label}
                    <input
                      type="number"
                      min="1"
                      value={variant[field] ?? ""}
                      onChange={(event) =>
                        update(index, {
                          [field]: event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                      className="mt-1 w-full border border-hairline bg-background p-2 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </fieldset>
  );
}

function SpecificationEditor({
  variants,
  items,
  onChange,
}: {
  variants: any[];
  items: any[];
  onChange: (value: any[]) => void;
}) {
  const update = (index: number, patch: any) =>
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  return (
    <fieldset>
      <div className="flex items-center justify-between">
        <legend className="text-sm">Группы характеристик</legend>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...items,
              {
                sectionTitle: "Характеристики",
                sectionOrder: 0,
                code: "custom",
                label: "",
                value: "",
                unit: "",
                sortOrder: items.length,
                variantKey: null,
              },
            ])
          }
          className="text-xs underline"
        >
          Добавить строку
        </button>
      </div>
      <datalist id="specification-codes">
        <option value="material" />
        <option value="use" />
        <option value="drainage" />
        <option value="components" />
        <option value="warranty" />
        <option value="care" />
        <option value="reservoir" />
        <option value="indicator" />
      </datalist>
      <div className="mt-3 space-y-3">
        {items.map((item, index) => (
          <article
            key={item.id ?? `${item.code}-${index}`}
            className="grid gap-2 border border-hairline p-3 md:grid-cols-4"
          >
            <input
              value={item.sectionTitle}
              onChange={(event) => update(index, { sectionTitle: event.target.value })}
              placeholder="Группа"
              className="border border-hairline bg-background p-2 text-sm"
            />
            <input
              list="specification-codes"
              value={item.code}
              onChange={(event) => update(index, { code: event.target.value })}
              placeholder="Код"
              className="border border-hairline bg-background p-2 text-sm"
            />
            <input
              value={item.label}
              onChange={(event) => update(index, { label: event.target.value })}
              placeholder="Подпись"
              className="border border-hairline bg-background p-2 text-sm"
            />
            <input
              value={item.value}
              onChange={(event) => update(index, { value: event.target.value })}
              placeholder="Значение"
              className="border border-hairline bg-background p-2 text-sm"
            />
            <input
              value={item.unit ?? ""}
              onChange={(event) => update(index, { unit: event.target.value || null })}
              placeholder="Единица"
              className="border border-hairline bg-background p-2 text-sm"
            />
            <select
              value={item.variantKey ?? ""}
              onChange={(event) => update(index, { variantKey: event.target.value || null })}
              className="border border-hairline bg-background p-2 text-sm"
            >
              <option value="">Для всех исполнений</option>
              {variants.map((variant) => (
                <option
                  key={`${variant.sizeCode}:${variant.system}`}
                  value={`${variant.sizeCode}:${variant.system}`}
                >
                  {variant.sizeCode} · {variant.system === "smart" ? "SMART" : "Standard"}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              value={item.sectionOrder ?? 0}
              onChange={(event) => update(index, { sectionOrder: Number(event.target.value) })}
              title="Порядок группы"
              className="border border-hairline bg-background p-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              className="text-left text-sm text-destructive underline"
            >
              Удалить строку
            </button>
          </article>
        ))}
      </div>
    </fieldset>
  );
}

function Collections({ data, refresh }: { data: any; refresh: () => void }) {
  const [item, setItem] = useState<any | null>(null);
  const remove = async (id: string) => {
    if (confirm("Удалить коллекцию? Товары останутся без коллекции.")) {
      await deleteCollectionFn({ data: { id } });
      refresh();
    }
  };
  return (
    <section className="py-8">
      <div className="flex justify-between">
        <div>
          <p className="label-caps text-taupe">Структура</p>
          <h2 className="display-md mt-2">Коллекции</h2>
        </div>
        <button
          onClick={() => setItem({})}
          className="bg-ink px-5 py-3 text-xs uppercase tracking-[0.14em] text-primary-foreground"
        >
          Новая коллекция
        </button>
      </div>
      {item ? (
        <CollectionForm
          item={item}
          data={data}
          onDone={() => {
            setItem(null);
            refresh();
          }}
          onCancel={() => setItem(null)}
        />
      ) : (
        <div className="mt-7 grid gap-3 md:grid-cols-2">
          {data.collections.map((collection: any) => (
            <article key={collection.id} className="border border-hairline bg-background p-5">
              <p className="label-caps text-taupe">{collection.slug}</p>
              <h3 className="mt-2 font-display text-2xl">{collection.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{collection.tagline}</p>
              <button onClick={() => setItem(collection)} className="mt-4 underline">
                Изменить
              </button>
              <button
                onClick={() => remove(collection.id)}
                className="ml-4 text-destructive underline"
              >
                Удалить
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CollectionForm({
  item,
  data,
  onDone,
  onCancel,
}: {
  item: any;
  data: any;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [coverMediaId, setCoverMediaId] = useState<string | null>(item.coverMediaId ?? null);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    try {
      await saveCollectionFn({
        data: {
          id: item.id,
          slug: String(f.get("slug")),
          name: String(f.get("name")),
          title: String(f.get("title")),
          tagline: String(f.get("tagline")),
          description: String(f.get("description")),
          coverMediaId,
        },
      });
      toast.success("Коллекция сохранена");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка сохранения");
    }
  };
  return (
    <form onSubmit={submit} className="mt-7 grid gap-4 border border-hairline bg-background p-5">
      <div className="flex justify-between">
        <h3 className="font-display text-2xl">Коллекция</h3>
        <button type="button" onClick={onCancel} className="underline">
          Закрыть
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="name" label="Название" defaultValue={item.name} required />
        <Field name="slug" label="Slug" defaultValue={item.slug} required />
        <Field name="title" label="Заголовок" defaultValue={item.title} required />
        <Field name="tagline" label="Подзаголовок" defaultValue={item.tagline} required />
      </div>
      <label className="text-sm">
        Описание
        <textarea
          name="description"
          defaultValue={item.description}
          className="mt-1 min-h-28 w-full border border-hairline bg-background p-2"
        />
      </label>
      <MediaPicker
        data={data}
        selected={coverMediaId ? [coverMediaId] : []}
        onChange={(ids) => setCoverMediaId(ids[0] ?? null)}
        single
      />
      <button className="w-fit bg-ink px-5 py-3 text-xs uppercase tracking-[0.14em] text-primary-foreground">
        Сохранить коллекцию
      </button>
    </form>
  );
}

function References({ data, refresh }: { data: any; refresh: () => void }) {
  const [type, setType] = useState<"size" | "color" | "material">("size");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    try {
      await saveReferenceFn({
        data: {
          type,
          id: String(f.get("id") || "") || undefined,
          label: String(f.get("label")),
          hex: String(f.get("hex") || "") || undefined,
          sortOrder: Number(f.get("sortOrder") || 0),
        },
      });
      (event.currentTarget as HTMLFormElement).reset();
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    }
  };
  const rows = type === "size" ? data.sizes : type === "color" ? data.colors : data.materials;
  const remove = async (id: string) => {
    try {
      await deleteReferenceFn({ data: { type, id } });
      refresh();
    } catch {
      toast.error("Нельзя удалить используемый параметр");
    }
  };
  return (
    <section className="py-8">
      <p className="label-caps text-taupe">Справочники</p>
      <h2 className="display-md mt-2">Размеры, цвета, материалы</h2>
      <div className="mt-6 flex gap-2">
        {(["size", "color", "material"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setType(item)}
            className={`border px-4 py-2 text-xs uppercase ${type === item ? "border-ink bg-ink text-primary-foreground" : "border-hairline"}`}
          >
            {item === "size" ? "Размеры" : item === "color" ? "Цвета" : "Материалы"}
          </button>
        ))}
      </div>
      <form
        onSubmit={submit}
        className="mt-5 flex flex-wrap gap-3 border border-hairline bg-background p-4"
      >
        <Field
          name="id"
          label={type === "size" ? "Код" : "ID (необязательно)"}
          required={type === "size"}
        />
        <Field name="label" label="Название" required />
        {type === "color" ? <Field name="hex" label="#RRGGBB" required /> : null}
        <Field name="sortOrder" label="Порядок" type="number" defaultValue="0" />
        <button className="self-end bg-ink px-4 py-2.5 text-xs uppercase text-primary-foreground">
          Добавить
        </button>
      </form>
      <div className="mt-5 divide-y divide-hairline border border-hairline bg-background">
        {rows.map((row: any) => (
          <div key={row.id ?? row.code} className="flex items-center justify-between p-3 text-sm">
            <span>
              {row.label ?? row.name}{" "}
              {row.hex ? (
                <i
                  className="ml-2 inline-block h-3 w-3 rounded-full"
                  style={{ background: row.hex }}
                />
              ) : null}
            </span>
            <button
              onClick={() => remove(row.id ?? row.code)}
              className="text-destructive underline"
            >
              Удалить
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Media({ data, refresh }: { data: any; refresh: () => void }) {
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.set("file", file);
      await uploadMediaFn({ data: form });
      toast.success("Фото загружено");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка загрузки");
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Удалить файл?")) return;
    try {
      await deleteMediaFn({ data: { id } });
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Фото используется или не удалено");
    }
  };
  return (
    <section className="py-8">
      <p className="label-caps text-taupe">MinIO</p>
      <h2 className="display-md mt-2">Медиатека</h2>
      <label className="mt-6 inline-block bg-ink px-5 py-3 text-xs uppercase tracking-[0.14em] text-primary-foreground">
        Загрузить фото
        <input type="file" accept="image/*" onChange={upload} className="hidden" />
      </label>
      <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {data.media.map((media: any) => (
          <figure key={media.id} className="relative border border-hairline bg-background">
            <img
              src={media.publicUrl}
              alt={media.fileName}
              className="aspect-square w-full object-cover"
            />
            <figcaption className="truncate p-2 text-xs">{media.fileName}</figcaption>
            <button
              onClick={() => remove(media.id)}
              className="absolute right-2 top-2 bg-background/90 px-2 py-1 text-xs text-destructive"
            >
              Удалить
            </button>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Orders({ data, refresh }: { data: any; refresh: () => void }) {
  const changeStatus = async (id: string, status: string) => {
    try {
      await updateOrderStatusFn({ data: { id, status: status as any } });
      refresh();
    } catch {
      toast.error("Статус не обновлён");
    }
  };
  return (
    <section className="py-8">
      <p className="label-caps text-taupe">Заявки</p>
      <h2 className="display-md mt-2">Заказы</h2>
      <div className="mt-7 space-y-4">
        {data.orders.length ? (
          data.orders.map((order: any) => (
            <article key={order.id} className="border border-hairline bg-background p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="label-caps text-taupe">Заказ №{order.number}</p>
                  <h3 className="mt-2 font-display text-2xl">{order.customerName}</h3>
                  <p className="mt-1 text-sm">
                    {order.phone}
                    {order.email ? ` · ${order.email}` : ""}
                  </p>
                </div>
                <label className="text-sm">
                  Статус
                  <select
                    value={order.status}
                    onChange={(event) => changeStatus(order.id, event.target.value)}
                    className="ml-2 border border-hairline bg-background p-2"
                  >
                    <option value="new">Новый</option>
                    <option value="in_progress">В работе</option>
                    <option value="awaiting_customer">Ожидает клиента</option>
                    <option value="ready">Готов</option>
                    <option value="completed">Завершён</option>
                    <option value="cancelled">Отменён</option>
                  </select>
                </label>
              </div>
              <ul className="mt-4 border-t border-hairline pt-3 text-sm">
                {order.items.map((item: any) => (
                  <li key={item.id}>
                    {item.productName} · {item.sizeCode} · {item.system} · {item.quantity} шт. ·{" "}
                    {item.unitPrice} ₽
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                {order.deliveryMethod === "cdek_pvz" ? "СДЭК · пункт выдачи" : "СДЭК · курьер"}
                {order.cdekPointAddress ? ` · ${order.cdekPointAddress}` : ""}
                {order.deliveryAddress ? ` · ${order.deliveryAddress}` : ""}
                {order.deliveryCost !== null && order.deliveryCost !== undefined
                  ? ` · ${order.deliveryCost} ${order.deliveryCurrency ?? "RUB"}`
                  : ""}
                {order.deliveryPeriodMin !== null || order.deliveryPeriodMax !== null
                  ? ` · ${order.deliveryPeriodMin ?? order.deliveryPeriodMax}–${order.deliveryPeriodMax ?? order.deliveryPeriodMin} дн.`
                  : ""}
                {order.comment ? ` · ${order.comment}` : ""}
              </p>
            </article>
          ))
        ) : (
          <p className="mt-7 text-muted-foreground">Заказов пока нет.</p>
        )}
      </div>
    </section>
  );
}

function MediaPicker({
  data,
  selected,
  onChange,
  single = false,
}: {
  data: any;
  selected: string[];
  onChange: (ids: string[]) => void;
  single?: boolean;
}) {
  return (
    <fieldset>
      <legend className="text-sm">Фото {single ? "обложки" : "товара"}</legend>
      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {data.media.map((media: any) => {
          const active = selected.includes(media.id);
          return (
            <button
              key={media.id}
              type="button"
              onClick={() =>
                onChange(
                  single
                    ? active
                      ? []
                      : [media.id]
                    : active
                      ? selected.filter((id) => id !== media.id)
                      : [...selected, media.id],
                )
              }
              className={`relative overflow-hidden border ${active ? "border-ink ring-1 ring-ink" : "border-hairline"}`}
            >
              <img
                src={media.publicUrl}
                alt={media.fileName}
                className="aspect-square w-full object-cover"
              />
              {active ? (
                <span className="absolute inset-x-0 bottom-0 bg-ink/80 p-1 text-[10px] text-primary-foreground">
                  {single ? "Выбрано" : selected.indexOf(media.id) + 1}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Порядок выбора — порядок показа. Новые файлы загружаются во вкладке «Фото».
      </p>
    </fieldset>
  );
}
function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block min-w-36 flex-1 text-sm">
      {label}
      <input {...props} className="mt-1 w-full border border-hairline bg-background p-2" />
    </label>
  );
}

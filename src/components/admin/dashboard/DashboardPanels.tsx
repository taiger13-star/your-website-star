import type { DashboardReport } from "@/lib/dashboard-contract";
import { statusLabels, rub } from "./utils";
const box = "min-w-0 border border-hairline bg-background p-5 sm:p-7";
function List({
  rows,
  empty = "Пока нет данных",
}: {
  rows: { label: string; count: number }[];
  empty?: string;
}) {
  return rows.length ? (
    <ul className="mt-5 space-y-4">
      {rows.map((row) => (
        <li
          key={row.label}
          className="flex items-start justify-between gap-4 border-b border-hairline pb-3 text-sm last:border-0"
        >
          <span className="min-w-0 break-words">{row.label}</span>
          <strong className="shrink-0 tabular-nums">{row.count.toLocaleString("ru-RU")}</strong>
        </li>
      ))}
    </ul>
  ) : (
    <p className="mt-6 text-sm leading-6 text-taupe">{empty}</p>
  );
}
export function DashboardPanels({
  report,
  onNavigate,
}: {
  report: DashboardReport;
  onNavigate: (tab: "orders" | "products" | "users" | "customPrint") => void;
}) {
  return (
    <>
      <div className="grid gap-5 lg:grid-cols-3">
        <section className={box}>
          <p className="label-caps text-taupe">Текущий каталог</p>
          <h3 className="mt-2 font-display text-2xl">Готовность к продаже</h3>
          <List
            rows={[
              { label: "Опубликовано", count: report.catalog.published },
              { label: "Черновики", count: report.catalog.draft },
              { label: "Скрыто", count: report.catalog.hidden },
              { label: "Без фотографий", count: report.catalog.missingImages },
              { label: "Без доступных вариантов", count: report.catalog.unavailable },
            ]}
          />
          <button
            onClick={() => onNavigate("products")}
            className="mt-3 text-xs uppercase tracking-widest underline underline-offset-4"
          >
            Открыть каталог →
          </button>
        </section>
        <section className={box}>
          <p className="label-caps text-taupe">Заказы за период</p>
          <h3 className="mt-2 font-display text-2xl">Статусы</h3>
          <List
            rows={report.statuses.map((s) => ({ ...s, label: statusLabels[s.label] || s.label }))}
            empty="За выбранный период заказов нет."
          />
          <p className="mt-5 text-xs leading-5 text-taupe">
            Тестовых оплат: {report.commerce.mockPayments}. Они исключены из суммы подтверждённых
            поступлений.
          </p>
          <button
            onClick={() => onNavigate("orders")}
            className="mt-5 text-xs uppercase tracking-widest underline underline-offset-4"
          >
            Все заказы →
          </button>
        </section>
        <section className={box}>
          <p className="label-caps text-taupe">Связь со студией</p>
          <h3 className="mt-2 font-display text-2xl">Клиенты и запросы</h3>
          <List
            rows={[
              { label: "Аккаунтов всего", count: report.customers.total },
              { label: "С подтверждённой почтой", count: report.customers.verified },
              { label: "Новых аккаунтов за период", count: report.customers.new },
              { label: "Заявок на проекты за период", count: report.inquiries.projects },
              { label: "Заявок на 3D-печать за период", count: report.inquiries.printing },
            ]}
          />
          <div className="mt-3 flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate("users")}
              className="text-xs underline underline-offset-4"
            >
              Клиенты →
            </button>
            <button
              onClick={() => onNavigate("customPrint")}
              className="text-xs underline underline-offset-4"
            >
              3D-печать →
            </button>
          </div>
        </section>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={box}>
          <p className="label-caps text-taupe">Подтверждённые продажи</p>
          <h3 className="mt-2 font-display text-2xl">Изделия с наибольшей суммой оплат</h3>
          {report.topProducts.length ? (
            <div className="mt-6 space-y-4">
              {report.topProducts.map((p, i) => (
                <div key={p.name} className="flex gap-4 border-b border-hairline pb-4">
                  <span className="text-sm text-taupe">0{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm">{p.name}</p>
                    <p className="mt-1 text-xs text-taupe">{p.quantity} шт.</p>
                  </div>
                  <strong className="shrink-0 text-sm tabular-nums">{rub(p.revenue)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm leading-6 text-taupe">
              За этот период подтверждённых продаж изделий нет.
            </p>
          )}
        </section>
        <section className={box}>
          <p className="label-caps text-taupe">Заказы за период</p>
          <h3 className="mt-2 font-display text-2xl">Последние поступления</h3>
          {report.recentOrders.length ? (
            <div className="mt-6 space-y-4">
              {report.recentOrders.map((o) => (
                <button
                  key={o.number}
                  onClick={() => onNavigate("orders")}
                  className="flex w-full items-center justify-between gap-3 border-b border-hairline pb-4 text-left"
                >
                  <div>
                    <p className="text-sm">Заказ №{o.number}</p>
                    <p className="mt-1 text-xs text-taupe">
                      {statusLabels[o.status] || o.status}
                      {o.paymentStatus === "mock_paid" ? " · тестовая оплата" : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">{rub(o.total)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-taupe">Заказов пока нет.</p>
          )}
        </section>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          {
            title: "Источники переходов",
            rows: report.traffic?.sources.map((s) => ({
              ...s,
              label: s.label || "Прямой / внутренний",
            })),
          },
          { title: "Популярные страницы", rows: report.traffic?.paths },
          {
            title: "Устройства · просмотры",
            rows: report.traffic?.devices.map((s) => ({
              ...s,
              label:
                (
                  { desktop: "Компьютер", mobile: "Телефон", tablet: "Планшет" } as Record<
                    string,
                    string
                  >
                )[s.label] || s.label,
            })),
          },
        ].map((panel) => (
          <section key={panel.title} className={box}>
            <h3 className="font-display text-xl">{panel.title}</h3>
            <List
              rows={panel.rows || []}
              empty={
                report.trafficAvailable
                  ? "Посещения ещё не зарегистрированы."
                  : "Источник измерений недоступен."
              }
            />
          </section>
        ))}
      </div>
    </>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Download,
  RefreshCw,
  Users,
  ShoppingBag,
  Wallet,
  Radio,
  MessageSquare,
} from "lucide-react";
import { getAdminDashboardFn } from "@/lib/dashboard-functions";
import { csvCell, type DashboardDays, type DashboardReport } from "@/lib/dashboard-contract";
import { DashboardChart } from "./DashboardChart";
import { DashboardPanels } from "./DashboardPanels";
import { rub } from "./utils";

function download(report: DashboardReport) {
  const rows: (string | number)[][] = [
    ["NOIR ATELIER · Москва", report.generatedAt],
    ["Период, дней", report.days],
    ["Оплачено за изделия, RUB", report.commerce.revenue],
    ["Подтверждённых оплат", report.commerce.paidOrders],
    ["Дата", "Посетители", "Просмотры", "Заказы", "Оплачено за изделия, RUB"],
    ...report.series.map((d) => [
      d.date,
      report.trafficAvailable ? d.visitors : "недоступно",
      report.trafficAvailable ? d.views : "недоступно",
      d.orders,
      d.revenue,
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `noir-dashboard-${report.generatedAt.slice(0, 10)}-${report.days}d.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AdminDashboard({
  onNavigate,
}: {
  onNavigate: (tab: "orders" | "products" | "users" | "customPrint") => void;
}) {
  const [days, setDays] = useState<DashboardDays>(30);
  const query = useQuery({
    queryKey: ["admin-dashboard", days],
    queryFn: () => getAdminDashboardFn({ data: { days } }),
    retry: 1,
    staleTime: 15000,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    gcTime: 0,
  });
  const report = query.data;
  return (
    <section className="space-y-6 py-8" aria-labelledby="dashboard-heading">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="label-caps text-taupe">Пульс студии</p>
          <h2 id="dashboard-heading" className="mt-2 font-display text-3xl sm:text-4xl">
            Магазин в цифрах
          </h2>
          <p className="mt-3 text-xs leading-5 text-taupe">
            Календарные дни по Москве · автообновление раз в минуту
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-hairline bg-background p-1">
            {([1, 7, 30, 90] as const).map((n) => (
              <button
                key={n}
                onClick={() => setDays(n)}
                aria-pressed={days === n}
                className={`px-3 py-2 text-xs ${days === n ? "bg-ink text-primary-foreground" : "text-taupe"}`}
              >
                {n === 1 ? "Сегодня" : `${n} дней`}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Обновить дашборд"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            className="border border-hairline bg-background p-3 disabled:opacity-40"
          >
            <RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            disabled={!report}
            onClick={() => report && download(report)}
            className="flex items-center gap-2 border border-hairline bg-background px-4 py-3 text-xs disabled:opacity-40"
          >
            <Download className="size-4" />
            CSV
          </button>
        </div>
      </div>
      {query.isError ? (
        <div role="alert" className="border border-destructive/30 bg-background p-5 text-sm">
          Не удалось обновить показатели.{" "}
          {report
            ? "Ниже сохранены данные на указанное время."
            : "Проверьте соединение и повторите загрузку."}
          <button className="ml-3 underline" onClick={() => void query.refetch()}>
            Повторить
          </button>
        </div>
      ) : null}
      {!report && !query.isError ? (
        <div aria-label="Загрузка показателей" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-36 animate-pulse border border-hairline bg-background" />
          ))}
        </div>
      ) : null}
      {report ? (
        <>
          {report.testEnvironment ? (
            <p className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              Локальный тестовый стенд. Данные созданы для проверки и не относятся к действующему
              магазину.
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: "Сейчас на сайте",
                value: report.traffic?.online ?? null,
                detail: "Активность за последние 90 секунд",
                icon: Radio,
              },
              {
                label: "Посетители",
                value: report.traffic?.visitors ?? null,
                detail: "Уникальные браузеры за период",
                icon: Users,
              },
              {
                label: "Оплачено за изделия",
                value: rub(report.commerce.revenue),
                detail: `${report.commerce.paidOrders} подтверждённых оплат · без доставки`,
                icon: Wallet,
              },
              {
                label: "Заказы",
                value: report.commerce.orders,
                detail: `Сейчас в работе: ${report.commerce.activeOrders}`,
                icon: ShoppingBag,
              },
              {
                label: "Средний оплаченный заказ",
                value: rub(report.commerce.averageOrder),
                detail: "По подтверждённым оплатам изделий",
                icon: ArrowUpRight,
              },
              {
                label: "Заявки за период",
                value: report.inquiries.projects + report.inquiries.printing,
                detail: `Новых запросов 3D-печати сейчас: ${report.inquiries.newPrinting}`,
                icon: MessageSquare,
              },
            ].map((card) => (
              <article
                key={card.label}
                className="min-w-0 border border-hairline bg-background p-5 sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-widest text-taupe">{card.label}</p>
                  <card.icon className="size-4 shrink-0 text-taupe" />
                </div>
                <p
                  aria-label={card.label}
                  className="mt-5 break-words font-display text-4xl tabular-nums"
                >
                  {card.value === null
                    ? "—"
                    : typeof card.value === "number"
                      ? card.value.toLocaleString("ru-RU")
                      : card.value}
                </p>
                <p className="mt-3 text-xs leading-5 text-taupe">{card.detail}</p>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-3 text-xs leading-5 text-taupe">
            <p>
              {report.trafficAvailable
                ? `Просмотры: ${report.traffic!.views} · Сеансы: ${report.traffic!.sessions}`
                : "Посещения недоступны: требуется миграция таблиц измерений."}
              {report.traffic?.firstMeasurement
                ? ` · Доступные данные с ${new Date(report.traffic.firstMeasurement).toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow" })}`
                : ""}
            </p>
            <p>
              Обновлено{" "}
              {new Date(report.generatedAt).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}
            </p>
          </div>
          <DashboardChart report={report} />
          <DashboardPanels report={report} onNavigate={onNavigate} />
          <div className="flex flex-wrap justify-between gap-4 border-t border-hairline pt-5 text-xs leading-5 text-taupe">
            <p>
              Посещения измеряются с момента подключения. Блокировщики и настройки приватности могут
              уменьшать показатели.
            </p>
            <a
              href="https://metrika.yandex.ru/dashboard?id=114077852"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 underline underline-offset-4"
            >
              История и цели в Яндекс Метрике ↗
            </a>
          </div>
        </>
      ) : null}
    </section>
  );
}

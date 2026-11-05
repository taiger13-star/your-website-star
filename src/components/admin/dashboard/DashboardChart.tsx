import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardReport } from "@/lib/dashboard-contract";

const date = (value: string) => value.slice(8) + "." + value.slice(5, 7);
export function DashboardChart({ report }: { report: DashboardReport }) {
  const [mode, setMode] = useState<"traffic" | "sales">("traffic");
  const traffic = mode === "traffic" && report.trafficAvailable;
  return (
    <section className="min-w-0 border border-hairline bg-background p-5 sm:p-7">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label-caps text-taupe">Динамика по дням</p>
          <h3 className="mt-2 font-display text-2xl">
            {traffic ? "Внимание к студии" : "Заказы и оплаты"}
          </h3>
        </div>
        <div className="flex gap-1 border border-hairline p-1">
          {(["traffic", "sales"] as const).map((id) => (
            <button
              key={id}
              disabled={id === "traffic" && !report.trafficAvailable}
              aria-pressed={traffic ? id === "traffic" : id === "sales"}
              onClick={() => setMode(id)}
              className={`px-3 py-2 text-xs disabled:opacity-40 ${(traffic ? id === "traffic" : id === "sales") ? "bg-ink text-primary-foreground" : "text-taupe"}`}
            >
              {id === "traffic" ? "Посещения" : "Продажи"}
            </button>
          ))}
        </div>
      </div>
      <div
        className="h-72 w-full"
        role="img"
        aria-label={
          traffic
            ? "Посетители и просмотры по дням. Точные значения доступны в CSV."
            : "Заказы и оплаченные изделия по дням. Точные значения доступны в CSV."
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          {traffic ? (
            <AreaChart data={report.series} margin={{ left: -16, right: 4, top: 8 }}>
              <defs>
                <linearGradient id="noir-traffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8d745c" stopOpacity={0.23} />
                  <stop offset="100%" stopColor="#8d745c" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e7e2db" />
              <XAxis
                dataKey="date"
                tickFormatter={date}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip labelFormatter={(value) => date(String(value))} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="views"
                name="Просмотры"
                stroke="#b3aca2"
                fill="transparent"
                strokeDasharray="4 4"
              />
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="visitors"
                name="Посетители"
                stroke="#8d745c"
                fill="url(#noir-traffic)"
                strokeWidth={2}
              />
            </AreaChart>
          ) : (
            <ComposedChart data={report.series} margin={{ left: -16, right: 0, top: 8 }}>
              <CartesianGrid vertical={false} stroke="#e7e2db" />
              <XAxis
                dataKey="date"
                tickFormatter={date}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="orders"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="rub"
                orientation="right"
                tickFormatter={(value) => `${Number(value) / 1000}т₽`}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip labelFormatter={(value) => date(String(value))} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
              <Bar
                isAnimationActive={false}
                yAxisId="orders"
                dataKey="orders"
                name="Заказы, шт."
                fill="#b3aca2"
                maxBarSize={28}
              />
              <Line
                isAnimationActive={false}
                yAxisId="rub"
                type="monotone"
                dataKey="revenue"
                name="Оплачено за изделия, ₽"
                stroke="#4e5c4c"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

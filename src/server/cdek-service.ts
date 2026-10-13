import { and, eq } from "drizzle-orm";

import { getDb } from "./db";
import { productVariantMeasurements, productVariants } from "./schema";

const API_URL = "https://api.cdek.ru/v2";
const ORIGIN_CITY_CODE = Number(process.env["CDEK_ORIGIN_CITY_CODE"] ?? "44");
const MAX_TARIFFS_TO_TRY = 40;

type CdekToken = { token: string; expiresAt: number };
let cachedToken: CdekToken | null = null;

type CdekApiError = { errors?: { code?: string; message?: string }[]; message?: string };

export type CdekCity = { code: number; name: string; region: string | null };
export type CdekPickupPoint = {
  code: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type CdekDeliveryQuote = {
  method: "cdek_pvz" | "cdek_courier";
  tariffCode: number;
  tariffName: string;
  cost: number;
  currency: string;
  periodMin: number | null;
  periodMax: number | null;
  pickupPoint?: CdekPickupPoint;
  /** True while API credentials are unavailable or CDEK_MODE=mock is set. */
  isTest: boolean;
};

type CheckoutItem = { productId: string; variantId: string; quantity: number };
type DeliveryInput = {
  method: "cdek_pvz" | "cdek_courier";
  cityCode: number;
  pickupPointCode?: string;
  deliveryAddress?: string;
  items: CheckoutItem[];
};

function configured() {
  return Boolean(process.env["CDEK_CLIENT_ID"] && process.env["CDEK_CLIENT_SECRET"]);
}

function usesMockCdek() {
  return process.env["CDEK_MODE"] === "mock" || !configured();
}

function cdekError(payload: unknown, fallback: string) {
  const value = payload as CdekApiError;
  const detail = value?.errors
    ?.map((error) => error.message)
    .filter(Boolean)
    .join(" ");
  return new Error(detail || value?.message || fallback);
}

async function getToken() {
  if (!configured()) throw new Error("Не заданы ключи API СДЭК.");
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env["CDEK_CLIENT_ID"]!,
    client_secret: process.env["CDEK_CLIENT_SECRET"]!,
  });
  const response = await fetch(`${API_URL}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
  } | null;
  if (!response.ok || !payload?.access_token)
    throw cdekError(payload, "Не удалось получить доступ к СДЭК.");
  cachedToken = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max(60, payload.expires_in ?? 3_600) * 1_000,
  };
  return cachedToken.token;
}

/**
 * Temporary development data used until the shop receives production CDEK API
 * credentials. The browser still calls the same server functions, so switching
 * to the live integration only requires adding credentials and restarting.
 */
const MOCK_CITIES: Array<CdekCity & { center: [number, number] }> = [
  { code: 44, name: "Москва", region: "Москва", center: [37.6176, 55.7558] },
  {
    code: 137,
    name: "Санкт-Петербург",
    region: "Санкт-Петербург",
    center: [30.3159, 59.9391],
  },
  { code: 250, name: "Екатеринбург", region: "Свердловская область", center: [60.5975, 56.8389] },
  { code: 270, name: "Новосибирск", region: "Новосибирская область", center: [82.9204, 55.0302] },
  { code: 43, name: "Казань", region: "Республика Татарстан", center: [49.1064, 55.7963] },
  { code: 438, name: "Ростов-на-Дону", region: "Ростовская область", center: [39.7015, 47.2357] },
];

function mockCity(cityCode: number) {
  return MOCK_CITIES.find((city) => city.code === cityCode);
}

function mockPickupPoints(cityCode: number): CdekPickupPoint[] {
  const city = mockCity(cityCode);
  if (!city) return [];
  const points = [
    [-0.018, 0.008],
    [0.014, -0.011],
    [0.009, 0.015],
    [-0.012, -0.016],
    [0.022, 0.001],
  ] as const;
  return points.map(([longitudeOffset, latitudeOffset], index) => ({
    code: `TEST-${city.code}-${index + 1}`,
    address: `Тестовый пункт СДЭК №${index + 1}, ${city.name}`,
    latitude: city.center[1] + latitudeOffset,
    longitude: city.center[0] + longitudeOffset,
  }));
}

function mockQuote(
  input: DeliveryInput,
  packages: Package[],
  pickupPoint: CdekPickupPoint | undefined,
): CdekDeliveryQuote {
  const city = mockCity(input.cityCode);
  if (!city) throw new Error("В тестовом режиме выберите город из предложенного списка.");
  const destinationExtra =
    input.cityCode === ORIGIN_CITY_CODE ? 0 : input.cityCode === 137 ? 180 : 320;
  const packageExtra = packages.reduce((sum, item) => sum + Math.ceil(item.weight / 1_000) * 55, 0);
  const base = input.method === "cdek_pvz" ? 390 : 590;
  const cost = base + destinationExtra + packageExtra;
  const periodMin = input.cityCode === ORIGIN_CITY_CODE ? 1 : 3;
  return {
    method: input.method,
    tariffCode: input.method === "cdek_pvz" ? 9_001 : 9_002,
    tariffName: input.method === "cdek_pvz" ? "Тестовый тариф до ПВЗ" : "Тестовый тариф курьером",
    cost,
    currency: "RUB",
    periodMin,
    periodMax: periodMin + 2,
    ...(pickupPoint ? { pickupPoint } : {}),
    isTest: true,
  };
}

async function cdekFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${await getToken()}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw cdekError(payload, "СДЭК временно недоступен.");
  return payload as T;
}

function searchParams(values: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params;
}

export async function findCdekCities(query: string): Promise<CdekCity[]> {
  if (usesMockCdek()) {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
    return MOCK_CITIES.filter(
      (city) =>
        city.name.toLocaleLowerCase("ru-RU").includes(normalizedQuery) ||
        (city.region?.toLocaleLowerCase("ru-RU").includes(normalizedQuery) ?? false),
    ).map(({ code, name, region }) => ({ code, name, region }));
  }
  const params = searchParams({ city: query, country_codes: "RU", size: 20, page: 0 });
  const rows = await cdekFetch<
    { code?: number; city?: string; city_uuid?: string; region?: string; region_code?: number }[]
  >(`/location/cities?${params}`);
  return rows
    .filter((row) => Number.isInteger(row.code) && row.city)
    .map((row) => ({ code: row.code!, name: row.city!, region: row.region ?? null }));
}

type RawPickupPoint = {
  code?: string;
  address?: string;
  is_handout?: boolean;
  location?: { latitude?: number; longitude?: number };
};

function normalizePickupPoint(row: RawPickupPoint): CdekPickupPoint | null {
  const latitude = row.location?.latitude;
  const longitude = row.location?.longitude;
  if (!row.code || !row.address || typeof latitude !== "number" || typeof longitude !== "number")
    return null;
  return { code: row.code, address: row.address, latitude, longitude };
}

export async function findCdekPickupPoints(cityCode: number): Promise<CdekPickupPoint[]> {
  if (usesMockCdek()) return mockPickupPoints(cityCode);
  const params = searchParams({
    city_code: cityCode,
    type: "PVZ",
    is_handout: true,
    size: 1_000,
    page: 0,
  });
  const rows = await cdekFetch<RawPickupPoint[]>(`/deliverypoints?${params}`);
  return rows
    .filter((row) => row.is_handout !== false)
    .map(normalizePickupPoint)
    .filter((point): point is CdekPickupPoint => point !== null);
}

type Package = { length: number; width: number; height: number; weight: number };

async function packagesFor(items: CheckoutItem[]): Promise<Package[]> {
  const db = getDb();
  const packages: Package[] = [];
  for (const item of items) {
    const [variant] = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        enabled: productVariants.enabled,
        length: productVariants.packageLengthCm,
        width: productVariants.packageWidthCm,
        height: productVariants.packageHeightCm,
        weight: productVariants.packageWeightGrams,
        outerWidthMm: productVariantMeasurements.outerWidthMm,
        outerDepthMm: productVariantMeasurements.outerDepthMm,
        outerDiameterMm: productVariantMeasurements.outerDiameterMm,
        outerHeightMm: productVariantMeasurements.outerHeightMm,
        productWeightGrams: productVariantMeasurements.weightGrams,
      })
      .from(productVariants)
      .leftJoin(
        productVariantMeasurements,
        eq(productVariantMeasurements.variantId, productVariants.id),
      )
      .where(
        and(eq(productVariants.id, item.variantId), eq(productVariants.productId, item.productId)),
      )
      .limit(1);
    if (!variant?.enabled) throw new Error("Один из товаров больше недоступен для заказа.");
    const hasPackage = [variant.length, variant.width, variant.height, variant.weight].every(
      (value) => typeof value === "number" && value > 0,
    );
    if (!hasPackage && !usesMockCdek())
      throw new Error("Для одного из товаров ещё не задана упаковка для расчёта доставки.");
    // Only the test tariff may estimate a parcel from product measurements.
    // Real CDEK quotes require the actual packed dimensions and weight above.
    const estimateCm = (millimeters: number | null) =>
      millimeters && millimeters > 0 ? Math.ceil(millimeters / 10) + 4 : 20;
    const fallbackWidthMm = variant.outerWidthMm ?? variant.outerDiameterMm;
    const fallbackDepthMm = variant.outerDepthMm ?? variant.outerDiameterMm;
    const parcel = {
      length: variant.length && variant.length > 0 ? variant.length : estimateCm(fallbackWidthMm),
      width: variant.width && variant.width > 0 ? variant.width : estimateCm(fallbackDepthMm),
      height:
        variant.height && variant.height > 0 ? variant.height : estimateCm(variant.outerHeightMm),
      weight:
        variant.weight && variant.weight > 0
          ? variant.weight
          : Math.max(500, (variant.productWeightGrams ?? 700) + 300),
    };
    for (let count = 0; count < item.quantity; count += 1) {
      packages.push(parcel);
    }
  }
  return packages;
}

type TariffCodeResponse = { tariff_codes?: (number | { tariff_code?: number })[] };
type TariffResponse = {
  delivery_sum?: number;
  total_sum?: number;
  period_min?: number;
  period_max?: number;
  calendar_min?: number;
  calendar_max?: number;
  tariff_name?: string;
  currency?: string;
};

function tariffCodes(value: TariffCodeResponse) {
  return (value.tariff_codes ?? [])
    .map((item) => Number(typeof item === "number" ? item : item.tariff_code))
    .filter((item): item is number => Number.isInteger(item));
}

function calculationBody(input: DeliveryInput, packages: Package[], tariffCode?: number) {
  return {
    type: 1,
    currency: 1,
    date: new Date().toISOString().slice(0, 10),
    ...(tariffCode ? { tariff_code: tariffCode } : {}),
    from_location: { code: ORIGIN_CITY_CODE },
    to_location: {
      code: input.cityCode,
      ...(input.method === "cdek_courier" ? { address: input.deliveryAddress } : {}),
    },
    ...(input.method === "cdek_pvz" ? { delivery_point: input.pickupPointCode } : {}),
    packages,
  };
}

async function resolvePickupPoint(input: DeliveryInput) {
  if (!input.pickupPointCode) throw new Error("Выберите пункт выдачи СДЭК на карте.");
  const points = await findCdekPickupPoints(input.cityCode);
  const selected = points.find((point) => point.code === input.pickupPointCode);
  if (!selected) throw new Error("Выбранный пункт выдачи больше недоступен. Выберите другой.");
  return selected;
}

export async function calculateCdekDelivery(input: DeliveryInput): Promise<CdekDeliveryQuote> {
  if (!Number.isInteger(ORIGIN_CITY_CODE) || ORIGIN_CITY_CODE <= 0)
    throw new Error("Не задан город отправления СДЭК.");
  if (input.method === "cdek_courier" && !input.deliveryAddress?.trim())
    throw new Error("Укажите адрес доставки курьером.");
  const [packages, pickupPoint] = await Promise.all([
    packagesFor(input.items),
    input.method === "cdek_pvz" ? resolvePickupPoint(input) : Promise.resolve(undefined),
  ]);
  if (usesMockCdek()) return mockQuote(input, packages, pickupPoint);
  const available = await cdekFetch<TariffCodeResponse>("/calculator/tarifflist", {
    method: "POST",
    body: JSON.stringify(calculationBody(input, packages)),
  });
  const codes = tariffCodes(available).slice(0, MAX_TARIFFS_TO_TRY);
  if (!codes.length) throw new Error("Для этого направления нет доступных тарифов СДЭК.");
  const results = await Promise.all(
    codes.map(async (tariffCode) => {
      try {
        const result = await cdekFetch<TariffResponse>("/calculator/tariff", {
          method: "POST",
          body: JSON.stringify(calculationBody(input, packages, tariffCode)),
        });
        const cost = result.total_sum ?? result.delivery_sum;
        return typeof cost === "number" && Number.isFinite(cost)
          ? { tariffCode, result, cost: Math.round(cost) }
          : null;
      } catch {
        return null;
      }
    }),
  );
  const selected = results
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => left.cost - right.cost)[0];
  if (!selected) throw new Error("СДЭК не вернул стоимость для этого направления.");
  return {
    method: input.method,
    tariffCode: selected.tariffCode,
    tariffName: selected.result.tariff_name ?? "СДЭК",
    cost: selected.cost,
    currency: selected.result.currency ?? "RUB",
    periodMin: selected.result.period_min ?? selected.result.calendar_min ?? null,
    periodMax: selected.result.period_max ?? selected.result.calendar_max ?? null,
    ...(pickupPoint ? { pickupPoint } : {}),
    isTest: false,
  };
}

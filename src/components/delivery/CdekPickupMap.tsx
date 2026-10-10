import { useEffect, useRef, useState } from "react";

import type { CdekPickupPoint } from "@/server/cdek-service";

type YandexMap = { addChild: (child: unknown) => void; destroy?: () => void };
type YandexMapsApi = {
  ready: Promise<void>;
  YMap: new (
    root: HTMLElement,
    options: { location: { center: [number, number]; zoom: number } },
  ) => YandexMap;
  YMapDefaultSchemeLayer: new (options: Record<string, never>) => unknown;
  YMapDefaultFeaturesLayer: new (options: Record<string, never>) => unknown;
  YMapMarker: new (options: { coordinates: [number, number] }, element: HTMLElement) => unknown;
};

declare global {
  interface Window {
    ymaps3?: YandexMapsApi;
  }
}

let yandexMapsLoader: Promise<YandexMapsApi> | null = null;

function loadYandexMaps(apiKey: string) {
  const existingMaps = window.ymaps3;
  if (existingMaps) return existingMaps.ready.then(() => existingMaps);
  if (yandexMapsLoader) return yandexMapsLoader;
  const pending = new Promise<YandexMapsApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      const maps = window.ymaps3;
      if (!maps) return reject(new Error("Яндекс Карты не инициализировались."));
      void maps.ready.then(() => resolve(maps), reject);
    };
    script.onerror = () => {
      script.remove();
      reject(
        new Error(
          "Не удалось загрузить Яндекс Карты. Проверьте ключ JavaScript API и ограничение HTTP Referer.",
        ),
      );
    };
    document.head.append(script);
  });
  yandexMapsLoader = pending.catch((error: unknown) => {
    yandexMapsLoader = null;
    throw error;
  });
  return yandexMapsLoader;
}

function mapCenter(points: CdekPickupPoint[]): [number, number] {
  const longitude = points.reduce((sum, point) => sum + point.longitude, 0) / points.length;
  const latitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
  return [longitude, latitude];
}

export function CdekPickupMap({
  points,
  selectedCode,
  onSelect,
}: {
  points: CdekPickupPoint[];
  selectedCode?: string;
  onSelect: (point: CdekPickupPoint) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const apiKey = import.meta.env["VITE_YANDEX_MAPS_API_KEY"] as string | undefined;

  useEffect(() => {
    if (!root.current || !points.length || !apiKey) return;
    let cancelled = false;
    let map: YandexMap | undefined;
    void loadYandexMaps(apiKey)
      .then((ymaps3) => {
        if (cancelled || !root.current) return;
        map = new ymaps3.YMap(root.current, {
          location: { center: mapCenter(points), zoom: 12 },
        });
        map.addChild(new ymaps3.YMapDefaultSchemeLayer({}));
        map.addChild(new ymaps3.YMapDefaultFeaturesLayer({}));
        for (const point of points) {
          const marker = document.createElement("button");
          marker.type = "button";
          marker.title = point.address;
          marker.setAttribute("aria-label", `Выбрать пункт СДЭК: ${point.address}`);
          marker.className =
            point.code === selectedCode
              ? "h-5 w-5 rounded-full border-2 border-white bg-ink shadow-[0_0_0_3px_#111]"
              : "h-4 w-4 rounded-full border-2 border-white bg-ink shadow-md";
          marker.addEventListener("click", () => onSelect(point));
          map.addChild(
            new ymaps3.YMapMarker({ coordinates: [point.longitude, point.latitude] }, marker),
          );
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(cause instanceof Error ? cause.message : "Не удалось загрузить карту.");
      });
    return () => {
      cancelled = true;
      map?.destroy?.();
    };
  }, [apiKey, onSelect, points, retry, selectedCode]);

  if (!apiKey)
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Карта временно недоступна: не задан ключ Яндекс Карт.
      </p>
    );
  if (error)
    return (
      <div className="p-6 text-sm">
        <p className="text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setRetry((value) => value + 1);
          }}
          className="mt-4 border border-ink px-4 py-2 text-xs uppercase tracking-[0.12em]"
        >
          Повторить загрузку
        </button>
      </div>
    );
  return (
    <div ref={root} className="h-[70vh] min-h-96 w-full" aria-label="Карта пунктов выдачи СДЭК" />
  );
}

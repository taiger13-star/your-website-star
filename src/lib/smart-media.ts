// Reviewed historical illustrations. They show a side window and are not current product photos.
export const SMART_ARCHIVE_NOTICE =
  "Архивная визуализация: боковое окно относится к прежней конструкции. В актуальном исполнении поплавковый индикатор расположен сверху.";
const reviewedFileNames = new Set([
  "smart-detail.jpg",
  "smart-01.jpg",
  "smart-02.jpg",
  "smart-03.jpg",
]);
const reviewedPublicPaths = new Set([
  "/storage/noir-catalog/uploads/2026-09-30/2a784773-efea-4aef-af02-70dd1ef9edf8.jpg",
  "/storage/noir-catalog/uploads/2026-09-30/2ca2ecc1-1cbd-4031-9f8d-3f2316d94156.jpg",
  "/storage/noir-catalog/uploads/2026-09-30/70a64f59-414a-4ba8-a417-1bdf7af51f24.jpg",
]);
export function smartImageNotice(url: string, fileName?: string) {
  const path = new URL(url, "https://noir-atelier.ru").pathname;
  const baseName = (fileName ?? path.split("/").pop() ?? "").toLowerCase();
  return reviewedFileNames.has(baseName) || reviewedPublicPaths.has(path)
    ? SMART_ARCHIVE_NOTICE
    : null;
}

// Exact matches only: never overwrite a newly edited description or change the database.
const reviewedCopy: Record<
  string,
  { oldShort?: string; short?: string; oldDescription: string; description: string }
> = {
  "noir-essential-05": {
    oldShort: "Кашпо с автополивом и прозрачным окном уровня воды.",
    short: "Кашпо с капиллярным автополивом и верхним поплавковым индикатором.",
    oldDescription:
      "Резервуар ориентировочно на 1 литр, капиллярная подача без фитилей, поплавковый индикатор и отметки MAX / MIN на окне. Долив воды — через верхнюю сервисную зону с крышкой.",
    description:
      "Капиллярная подача воды через опоры с грунтом — без фитилей и электричества. Поплавковый индикатор расположен сверху, бокового окна нет. Долив — через верхнюю горловину с крышкой. Объём резервуара зависит от модели и размера.",
  },
  "noir-essential-06": {
    oldDescription:
      "Рассчитано на растения с активной корневой системой: объём резервуара увеличен, вставка опирается на верхний край и на центральную ножку. Прозрачное окно защищено от прямых лучей — вода не цветёт.",
    description:
      "Резервуар находится под посадочной камерой. Вода поступает к грунту капиллярно через полые опоры. Съёмное второе дно доступно для обслуживания. Поплавковый индикатор расположен сверху; бокового окна нет.",
  },
  "noir-essential-07": {
    oldDescription:
      "Тот же механизм автополива в спокойной форме, которая встаёт в нишу или в ряд на подоконнике. Крышка заливного отверстия скрыта под кромкой и не видна с уровня глаз.",
    description:
      "Капиллярный автополив в спокойной форме. Съёмное второе дно с опорами, верхняя заливная горловина с крышкой и поплавковый индикатор сверху. Бокового окна нет.",
  },
};
export function reviewedSmartCopy(product: {
  slug: string;
  shortDescription: string;
  description: string;
}) {
  const review = reviewedCopy[product.slug];
  return {
    shortDescription:
      review?.oldShort === product.shortDescription ? review.short! : product.shortDescription,
    description:
      review?.oldDescription === product.description ? review.description : product.description,
  };
}

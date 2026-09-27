# NOIR ATELIER — roadmap

Полноценный многостраничный магазин на русском. Оплата не подключается.

## Источник моделей (MakerWorld)
- [x] Учесть: MakerWorld — только референс форм, не копировать STL/3MF
- [x] Поля source / creator / license / commercial use / source URL в товаре
- [x] commercialApproved: в публичном каталоге продаём только true
- [ ] Реальные лицензии и ссылки на конкретные модели — от пользователя

## Основа
- [x] Дизайн-система: палитра, шрифты, токены, анимации
- [x] Данные: 21 товар, 6 коллекций, размеры S/M/L/XL, 7 цветов, Standard/Smart
- [x]production-данные: материал, расход филамента, время печати, production file ID
- [x] Корзина (localStorage) + избранное (wishlist)

## Страницы
- [x] / главная
- [x] /collections
- [x] /catalog с фильтрами, сортировкой, переключателем сетки
- [x] /product/$slug — галерея, размеры, цвета, Standard/Smart, динамическая цена
- [x] /smart — устройство системы, exploded-view, как это работает
- [x] /configurator — «Создайте свой NOIR» (2D, смена цветов)
- [x] /business — B2B + форма
- [x] /custom — индивидуальный дизайн, этапы
- [x] /about
- [x] /faq, /delivery, /returns, /contacts
- [x] /cart, /checkout, /order/$number
- [x] /wishlist, /search
- [x] 404, пустые состояния, breadcrumbs, loading/hover
- [x] SEO: title/description/OG/canonical, JSON-LD товар и breadcrumbs

## Изображения
- [x] Единый арт-дирекшн: warm neutral interiors, stone, wood, soft daylight
- [x] Hero + imagery страниц
- [x] По одному фото на каждый товар + detail-съёмка для галерей

## Проверка
- [x] Сборка без ошибок
- [x] Сценарий: главная → коллекция → каталог → товар → размер/цвет/Smart → цена → корзина → заказ → номер
- [x] Desktop / tablet / mobile

## Блокируется пользователем
- Контакты, телефон, email, юр. данные — сейчас placeholders
- Реальные условия доставки и возврата — placeholders
- Подтверждение коммерческих лицензий на модели

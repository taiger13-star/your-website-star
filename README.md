# Your Website Star

привет мне сказали что ты лучший по созданию сайта

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a8f4eb9a-9d9c-418d-8cac-1ad5dd6eb9a0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
cp .env.example .env
npm run infra:up
npm run db:migrate
npm run db:seed
npm run dev
```

## Каталог и админка

- PostgreSQL работает в Docker на `localhost:5450`. MinIO API — на `localhost:6300`, его консоль — на `localhost:6301`. Образ MinIO собирается локально из официального закреплённого исходного релиза, поэтому запуск не зависит от закрытого container registry MinIO.
- Настройки и локальные секреты находятся в `.env`, он намеренно не попадает в Git. Перед первым запуском замените значения администратора и сессии в нём.
- URL админки: `/admin/<ADMIN_ROUTE_TOKEN>`. Токен должен состоять ровно из 32 латинских букв, а вход дополнительно защищён `ADMIN_PASSWORD` и HTTP-only сессией.
- `npm run db:seed` переносит текущий демонстрационный каталог и изображения из `src/assets` в PostgreSQL и MinIO. После импорта данные для витрины берутся из БД.

Полезные команды:

```sh
npm run infra:down     # остановить локальные контейнеры
npm run db:generate    # создать новую Drizzle-миграцию после изменения схемы
npm run db:migrate     # применить миграции
```

# 4Blanc — MVP личного кабинета клиента

MVP личного кабинета клиента для 4Blanc: клиент входит в систему, видит профиль и
историю заказов (с поиском и фильтром по статусу), может создать тикет в поддержку и
задавать вопросы **встроенному AI-ассистенту** о своих данных
(например: _«Покажи мои последние заказы»_, _«Сколько заказов за последний месяц?»_).

Этот репозиторий — тестовое задание на роль **AI-native Full-stack / Product Engineer**.
Помимо рабочего кода здесь есть набор инженерных документов
([Архитектура](#документация), [Самооценка](#документация) и др.).

---

## Стек технологий

| Слой            | Выбор                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| Frontend        | React 18, TypeScript, Vite, React Router, Axios                        |
| Backend         | NestJS 10, TypeScript, Prisma ORM, Passport JWT, class-validator       |
| База данных     | PostgreSQL 16                                                          |
| AI-ассистент    | Подключаемый провайдер — OpenAI **или** детерминированный rule-based fallback |
| Документация API| Swagger / OpenAPI (`/api/docs`)                                        |
| Инфраструктура  | Docker, Docker Compose, GitHub Actions                                 |
| Тесты           | Jest (unit + e2e на backend), Vitest + Testing Library (frontend)      |

---

## Быстрый старт (Docker — рекомендуется)

Нужны Docker и Docker Compose.

```bash
# из корня репозитория
docker compose up --build
```

Поднимаются три сервиса:

- **db** — PostgreSQL на `localhost:5432`
- **backend** — NestJS API на `http://localhost:3000/api` (при старте выполняются миграции и seed)
- **frontend** — nginx на `http://localhost:8080`

Откройте **http://localhost:8080** и войдите под демо-аккаунтом из seed:

```
email:    client@4blanc.com
password: 4Blanc#Demo26
```

Swagger UI: **http://localhost:3000/api/docs**

> AI-ассистент по умолчанию работает в детерминированном режиме `mock` (API-ключ не нужен).
> Для реальной LLM задайте `AI_PROVIDER=openai` и `OPENAI_API_KEY=...` (см. ниже).

---

## Локальная разработка (без Docker)

### 1. База данных

Запустите только Postgres через compose (или свой инстанс):

```bash
docker compose up -d db
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # при необходимости поправьте DATABASE_URL
npm install
npx prisma generate
npx prisma migrate deploy     # применить миграции
npx prisma db seed            # загрузить демо-данные
npm run start:dev             # http://localhost:3000/api
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173 (прокси /api на :3000)
```

---

## API

Базовый путь: `/api`

| Метод | Endpoint          | Auth | Описание                                              |
| ----- | ----------------- | ---- | ----------------------------------------------------- |
| POST  | `/login`          | —    | Аутентификация, возвращает JWT access token           |
| GET   | `/profile`        | JWT  | Профиль авторизованного клиента                       |
| GET   | `/orders`         | JWT  | Список заказов; параметры `?search=` и `?status=`   |
| POST  | `/support-ticket` | JWT  | Создать тикет в поддержку                             |
| GET   | `/support-ticket` | JWT  | Список тикетов клиента                                |
| POST  | `/assistant/chat` | JWT  | Вопрос AI-ассистенту об аккаунте                      |
| GET   | `/health`         | —    | Liveness + проверка БД                                |

Актуальный контракт — в **Swagger** на `/api/docs`.

### Пример

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"client@4blanc.com","password":"4Blanc#Demo26"}' | jq -r .accessToken)

curl -s http://localhost:3000/api/orders?status=DELIVERED \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## AI-ассистент

Ассистент устроен так, что **доступ к данным детерминирован и безопасен**, а
LLM отвечает только за формулировку ответа:

1. Backend строит **снимок аккаунта** для авторизованного пользователя (заказы,
   итоги, счётчики) — в рамках `userId`, чтобы пользователь не мог читать чужие данные.
2. В зависимости от `AI_PROVIDER`:
   - `mock` (по умолчанию): rule-based движок намерений отвечает по снимку. Полностью
     детерминирован, тестируем, работает offline / в CI.
   - `openai`: снимок + вопрос отправляются в OpenAI со строгим system prompt
     («отвечай только по переданным данным, не выдумывай заказы»). При сбое вызова —
     graceful fallback на rule-based движок.

Так снижается риск галлюцинаций; это осознанный компромисс MVP, описанный в
[`ARCHITECTURE.md`](./ARCHITECTURE.md) и [`SELF_REVIEW.md`](./SELF_REVIEW.md).

---

## Тесты

```bash
# unit-тесты backend
cd backend && npm test

# e2e backend (нужна запущенная/засеянная БД)
npm run test:e2e

# тесты frontend
cd frontend && npm test
```

CI ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) на каждый push / PR запускает
lint, unit + e2e, сборку обоих приложений и сборку Docker-образов.

---

## База данных и миграции

Схема: [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma).
Миграции в `backend/prisma/migrations`, применяются через
`prisma migrate deploy`. Демо-данные: `backend/prisma/seed.ts`.

Сущности: `User`, `Order`, `SupportTicket`.

---

## Документация

| Документ                                               | Содержание                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                 | Масштабирование системы (50k клиентов, B2B, лояльность, CRM, 1С, AI, внутренние сервисы) |
| [`SELF_REVIEW.md`](./SELF_REVIEW.md)                   | Честная критика: слабые места, риски prod, план на неделю / месяц          |
| [`PRODUCTION_INCIDENT.md`](./PRODUCTION_INCIDENT.md)   | Runbook инцидента: тикеты в поддержку не создаются после релиза в пятницу  |
| [`AI_WORKFLOW.md`](./AI_WORKFLOW.md)                   | Как использовались AI-инструменты при разработке                           |
| [`AI_ANALYSIS.md`](./AI_ANALYSIS.md)                   | Продуктовый и UX-анализ 4blanc.com с идеями роста                          |

---

## Структура проекта

```
.
├── backend/                # NestJS API
│   ├── src/
│   │   ├── auth/           # JWT login, guard, strategy
│   │   ├── users/          # GET /profile
│   │   ├── orders/         # GET /orders (поиск + фильтр)
│   │   ├── support/        # POST/GET /support-ticket
│   │   ├── assistant/      # POST /assistant/chat (AI)
│   │   ├── health/         # GET /health
│   │   └── prisma/         # Prisma service/module
│   ├── prisma/             # schema, migrations, seed
│   └── test/               # e2e-тесты
├── frontend/               # React + Vite клиент
│   └── src/
│       ├── components/     # ProfileCard, OrdersTable, SupportForm, AssistantChat
│       ├── pages/          # LoginPage, DashboardPage
│       ├── context/        # AuthContext
│       └── api.ts          # типизированный API-клиент
├── .github/workflows/ci.yml
├── docker-compose.yml
└── *.md                    # набор документации
```

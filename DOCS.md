# Telegram Client — Документація проєкту

## 1. Глобальна ціль

**Telegram Client** — це внутрішній B2B-інструмент для команд продажів, маркетингу та підтримки, який дозволяє централізовано керувати комунікацією через Telegram з багатьох акаунтів одночасно.

Продукт вирішує проблему масштабування персональної комунікації: коли одна людина не може ефективно вести десятки діалогів з різних акаунтів через стандартний Telegram-клієнт.

---

## 2. Проблеми, які вирішує сервіс

| Проблема | Як вирішує |
|----------|-----------|
| Менеджери працюють з кількох Telegram-акаунтів вручну | Єдиний веб-інтерфейс для всіх акаунтів |
| Ризик бану за масову розсилку | Вбудований rate-limiter: макс. 20 перших повідомлень/день на акаунт |
| Немає контролю хто що пише | Рольова модель: admin/manager, доступ через кабінети |
| Втрата контексту при переключенні між акаунтами | Централізований список чатів з історією повідомлень |
| CRM не бачить Telegram-комунікацію | Автоматичне логування подій для інтеграції з CRM |
| Немає розуміння воронки | Трекінг статусу чатів: не контактували → перше повідомлення → відповів |
| Затримки у відповідях на вхідні | Real-time сповіщення через WebSocket |

---

## 3. Ідея продукту

### Концепція
Сервіс організований навколо **кабінетів** — логічних контейнерів, що групують Telegram-акаунти за проєктами, командами або напрямками бізнесу. Кожен кабінет містить набір Telegram-акаунтів, а доступ до кабінетів надається через рольову систему.

### Користувацькі ролі

- **Admin** — повний доступ: створення кабінетів, додавання акаунтів, призначення менеджерів, відправка повідомлень
- **Manager** — доступ до призначених кабінетів: перегляд чатів, відправка повідомлень

### Ключові сценарії використання

1. **Outreach/Sales**: менеджери ведуть холодні розсилки з різних акаунтів, система контролює ліміти
2. **Підтримка клієнтів**: кілька операторів працюють з вхідними зверненнями через спільні акаунти
3. **Маркетингові кампанії**: масова відправка персональних повідомлень з контролем швидкості
4. **Моніторинг комунікації**: керівники бачать всю переписку підлеглих в реальному часі

---

## 4. Архітектура

### Загальна схема

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (SPA)                    │
│              React + TypeScript + Vite               │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │LoginForm │  │ Cabinet  │  │    ChatPanel       │  │
│  │          │  │ Selector │  │  + MessageList     │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└──────────────┬───────────────────┬──────────────────┘
               │ HTTP (REST API)   │ WebSocket
┌──────────────▼───────────────────▼──────────────────┐
│                Backend (API Server)                  │
│            Express + TypeScript + Socket.IO          │
│                                                     │
│  ┌─────────┐ ┌──────────┐ ┌────────────────────┐    │
│  │  Auth   │ │ Cabinets │ │ Telegram Accounts  │    │
│  │ Routes  │ │  Routes  │ │     Routes         │    │
│  └────┬────┘ └────┬─────┘ └────────┬───────────┘    │
│       │           │                │                 │
│  ┌────▼────┐ ┌────▼─────┐ ┌───────▼──────────┐     │
│  │  Auth   │ │ Cabinet  │ │    Telegram       │     │
│  │ Service │ │ Service  │ │    Manager        │     │
│  └─────────┘ └──────────┘ └──┬─────────┬─────┘     │
│                              │         │            │
│                    ┌─────────▼──┐  ┌───▼─────────┐  │
│                    │  Limiter   │  │     CRM      │  │
│                    │  Service   │  │  Integration │  │
│                    └────────────┘  └─────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────────┐
│                  PostgreSQL                          │
│                                                     │
│  Users, Cabinets, TelegramAccounts, Chats,          │
│  Messages, AccountDailyLimits, CrmEvents            │
└─────────────────────────────────────────────────────┘
```

### Технологічний стек

| Компонент | Технологія | Призначення |
|-----------|-----------|-------------|
| Frontend | React 18, TypeScript, Vite | SPA веб-інтерфейс |
| Backend | Express 4, TypeScript | REST API сервер |
| Real-time | Socket.IO | Миттєві оновлення повідомлень |
| ORM | Prisma 5 | Типобезпечна робота з БД |
| База даних | PostgreSQL | Зберігання даних |
| Автентифікація | JWT + bcrypt | Токен-автентифікація |

---

## 5. Структура проєкту

```
telegram-client/
├── DOCS.md                          # Ця документація
├── README.md                        # Інструкція запуску
├── .gitignore                       # Git-ігнорування
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example                 # Шаблон змінних оточення
│   ├── .gitignore
│   │
│   ├── prisma/
│   │   └── schema.prisma            # Схема бази даних
│   │
│   └── src/
│       ├── index.ts                 # Точка входу: Express + Socket.IO
│       ├── config.ts                # Валідація env-змінних
│       │
│       ├── middleware/
│       │   ├── authMiddleware.ts     # JWT-автентифікація та авторизація за ролями
│       │   └── errorHandler.ts      # Глобальний обробник помилок
│       │
│       ├── routes/
│       │   ├── auth.ts              # POST /api/auth/register, /login
│       │   ├── cabinets.ts          # CRUD кабінетів
│       │   ├── chats.ts             # Чати та повідомлення
│       │   └── telegramAccounts.ts  # Управління Telegram-акаунтами
│       │
│       ├── services/
│       │   ├── authService.ts       # Логіка реєстрації/логіну
│       │   ├── cabinetService.ts    # Логіка роботи з кабінетами
│       │   ├── limiterService.ts    # Rate-limiting (20 перших повідомлень/день)
│       │   └── crmIntegrationService.ts # Логування подій для CRM
│       │
│       ├── telegram/
│       │   └── telegramManager.ts   # Ядро: відправка/прийом повідомлень
│       │
│       └── types/
│           ├── limits.ts            # Інтерфейси для limiter
│           └── shared.ts            # Спільні типи (API responses, entities)
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    │
    └── src/
        ├── main.tsx                 # React entry point
        ├── App.tsx                  # Кореневий компонент
        │
        ├── api/
        │   └── client.ts           # HTTP-клієнт з авторизацією
        │
        ├── components/
        │   ├── LoginForm.tsx        # Форма логіну
        │   ├── CabinetSelector.tsx  # Вибір кабінету та акаунту
        │   ├── ChatPanel.tsx        # Панель чатів з відправкою
        │   └── MessageList.tsx      # Список повідомлень
        │
        └── types/
            └── index.ts            # Типи для фронтенду
```

---

## 6. Модель даних

### ER-діаграма (спрощена)

```
User ──< UserCabinet >── Cabinet ──< TelegramAccount ──< Chat ──< Message
                                            │
                                            └──< AccountDailyLimit

CrmEvent (незалежна таблиця логів)
```

### Опис сутностей

**User** — системний користувач
- `email` — унікальний email для логіну
- `passwordHash` — хеш паролю (bcrypt)
- `role` — admin | manager

**Cabinet** — організаційна одиниця (проєкт/команда)
- `name` — назва кабінету
- Пов'язаний з Users через UserCabinet (many-to-many)

**UserCabinet** — зв'язок користувач-кабінет
- `@@unique([userId, cabinetId])` — один юзер = один запис на кабінет

**TelegramAccount** — підключений Telegram-акаунт
- `phone` — номер телефону
- `sessionData` — зашифрована сесія Telegram
- `status` — active | paused | risk | error
- `displayName` — ім'я для відображення

**Chat** — діалог з контактом
- `chatId` — ID чату в Telegram
- `chatStatus` — not_contacted | first_sent | responded (воронка)
- `@@unique([telegramAccountId, chatId])` — один чат на акаунт

**Message** — повідомлення
- `direction` — in | out
- `text` — текст повідомлення
- `rawPayload` — повне тіло повідомлення (JSON)

**AccountDailyLimit** — денний ліміт першиx повідомлень
- `firstMessagesSent` — скільки відправлено сьогодні
- `maxFirstPerDay` — максимум (за замовчуванням 20)
- `@@unique([telegramAccountId, date])` — один запис на акаунт на день

**CrmEvent** — лог подій для CRM
- `direction` — in | out
- `payload` — JSON з даними повідомлення

---

## 7. API Endpoints

### Автентифікація (без токена)

| Метод | Шлях | Опис |
|-------|------|------|
| POST | `/api/auth/register` | Реєстрація (роль = manager за замовчуванням) |
| POST | `/api/auth/login` | Логін → accessToken + refreshToken |

### Кабінети (потрібен токен)

| Метод | Шлях | Роль | Опис |
|-------|------|------|------|
| GET | `/api/cabinets` | any | Список кабінетів (admin — всі, manager — свої) |
| POST | `/api/cabinets` | admin | Створити кабінет |
| POST | `/api/cabinets/:id/users` | admin | Призначити юзера до кабінету |

### Telegram-акаунти (потрібен токен)

| Метод | Шлях | Роль | Опис |
|-------|------|------|------|
| GET | `/api/telegram/accounts` | any | Список акаунтів доступних кабінетів |
| POST | `/api/telegram/accounts` | admin | Додати новий акаунт |
| POST | `/api/telegram/accounts/:id/send-code` | admin | Почати авторизацію акаунту |
| POST | `/api/telegram/accounts/:id/confirm-code` | admin | Підтвердити код авторизації |

### Чати та повідомлення (потрібен токен)

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/chats?accountId=:id` | Список чатів акаунту (з перевіркою доступу) |
| GET | `/api/chats/:id/messages` | Історія повідомлень чату |
| POST | `/api/chats/:id/messages` | Відправити повідомлення |

### WebSocket Events

| Подія | Напрямок | Опис |
|-------|----------|------|
| `new_message` | server → client | Нове повідомлення (scoped по кабінету) |

---

## 8. Бізнес-логіка

### Rate Limiting
- Кожен Telegram-акаунт може надіслати **максимум 20 перших повідомлень на день**
- "Перше повідомлення" = повідомлення в чат зі статусом `not_contacted` або `first_sent`
- Після того як контакт **відповів** (`responded`), ліміт не рахується — можна писати без обмежень
- Ліміт скидається щодня о 00:00 UTC

### Воронка чатів
```
not_contacted → first_sent → responded
     │              │              │
     │              │              └── Контакт відповів, ліміти зняті
     │              └── Перше повідомлення відправлено
     └── Контакт ще не отримував повідомлень
```

### CRM інтеграція
- Кожне вхідне та вихідне повідомлення автоматично записується в таблицю `CrmEvent`
- Зовнішні CRM-системи можуть читати ці події через API або webhook (розширення)

---

## 9. Безпека

- **Автентифікація**: JWT токени (access: 1 год, refresh: 7 днів)
- **Авторизація**: перевірка ролі + перевірка доступу до кабінету/акаунту
- **Паролі**: bcrypt з salt rounds = 10
- **CORS**: обмежений до конкретного домену фронтенду
- **Валідація**: zod-схеми на всіх ендпоінтах
- **Socket.IO**: JWT-автентифікація при підключенні
- **Error handling**: внутрішні помилки не витікають до клієнта

---

## 10. Запуск та розгортання

### Змінні оточення (backend/.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/telegram_client
JWT_SECRET=your-strong-random-secret-min-32-chars
TELEGRAM_API_ID=123456
TELEGRAM_API_HASH=your_hash
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

### Локальний запуск

```bash
# Backend
cd backend
npm install
cp .env.example .env        # Заповнити реальні значення
npm run prisma:generate
npm run prisma:migrate
npm run dev

# Frontend (в іншому терміналі)
cd frontend
npm install
npm run dev
```

### Production build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build  # Статика в dist/
```

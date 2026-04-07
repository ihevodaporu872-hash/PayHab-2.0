# Claude Code Rules

## Общие правила

- Использовать TypeScript для всего кода
- Следовать функциональному подходу с React hooks
- Компоненты создавать как функциональные (FC)
- Использовать строгую типизацию, избегать `any`
- Максимум 500 строк на файл — иначе дели на части

## Структура frontend/src/

```
frontend/src/
├── components/     # UI компоненты
├── pages/          # Страницы (LoginPage, MainPage)
├── hooks/          # Кастомные хуки (useAuth, useToast)
├── utils/          # Утилиты (formatters, cn)
├── types/          # TypeScript типы и интерфейсы
├── services/       # API-сервисы (employeeService, departmentService)
├── store/          # Контексты (AuthContext, SigurContext)
└── assets/         # Статические ресурсы
```

## Структура backend/app/

```
backend/app/
├── routes/         # Эндпоинты (employees, departments, positions, cards)
├── main.py         # FastAPI app, CORS, SIGUR клиент
├── auth.py         # JWT авторизация
├── sigur_client.py # Прокси к SIGUR REST API
├── config.py       # Настройки из .env
├── models.py       # Pydantic модели
└── utils.py        # Хелперы (split_name, join_name)
```

## Именование

- Компоненты: `PascalCase` (например, `UserCard.tsx`)
- Хуки: `camelCase` с префиксом `use` (например, `useAuth.ts`)
- Утилиты: `camelCase` (например, `formatDate.ts`)
- Типы/Интерфейсы: `PascalCase` с префиксом `I` для интерфейсов (например, `IUser`)
- Константы: `UPPER_SNAKE_CASE`

## Стиль кода

- Использовать arrow functions для компонентов
- Деструктуризация пропсов в параметрах функции
- Экспорт компонентов через `export const`
- Один компонент на файл

## Пример компонента

```tsx
import { FC } from 'react';

interface IButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: FC<IButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

## Тема оформления

- Поддерживаются **светлая** (по умолчанию) и **тёмная** темы
- Светлая: `:root`, тёмная: `:root.dark` — в `frontend/src/index.css`
- Переключатель в Header, состояние хранится в `localStorage` (`sigur-theme`)
- Хук: `useTheme()` из `frontend/src/hooks/useTheme.ts`
- Тени через переменные `--shadow` и `--shadow-lg`
- При добавлении новых компонентов использовать только CSS-переменные, **без хардкода цветов**

## Запрещено

- Использовать `var` (только `const` и `let`)
- Игнорировать TypeScript ошибки через `@ts-ignore`
- Использовать inline стили (кроме динамических значений)
- Мутировать состояние напрямую
- Локальный автоматический запуск приложений без явного разрешения пользователя

## Адаптивность (обязательно)

Все UI компоненты ОБЯЗАНЫ быть адаптированы под:

- **iPhone 15 Pro Max** (430 × 932 px)
- **iPhone 12** (390 × 844 px)
- **iPad** (768 × 1024 px и больше)

Использовать CSS media queries для корректного отображения на всех целевых устройствах.

## MVP

- Всегда делай минимально работающую версию
- Не добавляй фичи "на будущее"
- Сначала работает — потом улучшаем

## КРАТКОСТЬ

- Отвечай максимально сжато. Без пояснений и предисловий.
- Если запрашивают код — выводи только рабочие фрагменты кода в блоках, без текста.
- Изменения выдавай как *минимальный diff/patch* или как *конкретные вставки*.
- Не перечисляй, «что было сделано», если прямо не попросили.
- Если нужен текст — не более 5 пунктов, каждый ≤ 12 слов.

## Структура проекта (корень)

```
PayHab-2.0/
├── frontend/          # React 19 + TypeScript + Vite (порт 5173)
├── backend/           # Python FastAPI (порт 8001)
├── .env               # Общий конфиг (читается бэкендом)
└── CLAUDE.md
```

## Бэкенд (backend/)

- Python FastAPI, запуск: `cd backend && py -m uvicorn app.main:app --host 0.0.0.0 --port 8001`
- При изменении файлов в `backend/app/` — перезапустить сервер
- Проксирует запросы к SIGUR REST API (`/api/v1/`)
- Авторизация через JWT, эндпоинт `/api/auth/login`
- Маршруты: `employees`, `departments`, `positions`, `cards`

## Фронтенд (frontend/)

- Vite подхватывает изменения автоматически — перезапуск НЕ нужен
- Порт 5173

## .env

- НИКОГДА не изменять `.env` файл в корне проекта
- Ключи и URL добавляет только пользователь вручную

## Git

- Коммиты на русском, кратко (1-2 предложения)
- Без приписок "Generated with Claude Code" и "Co-Authored-By"
- После выполнения каждого запроса — коммит и пуш в GitHub

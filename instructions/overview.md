<!-- Инструкция: этот файл сгенерирован автоматически. Строго следуй этим правилам: - Не добавляй ничего от себя. - Не используй выдуманные данные. - Используй только то, что реально есть в репо. - Соблюдай структуру и стиль предыдущих файлов. - Не меняй формат и стиль без необходимости. - Пиши сухо, технически, по делу. -->

# Project Overview: node-red-contrib-playwright-js

## 📋 Базовая информация

| Параметр | Значение |
|----------|----------|
| **Название** | node-red-contrib-playwright-js |
| **Версия** | 0.2.7 |
| **Тип** | Node-RED плагин |
| **Лицензия** | MIT |
| **Основная технология** | Playwright + Node.js |

## 🎯 Назначение проекта

Node-RED плагин для автоматизации веб-браузера с использованием Playwright. Предоставляет возможности веб-серфинга, антидетекта и автоматического решения капчи в рамках Node-RED flows.

## 🏗️ Архитектура

### Основные компоненты
- **3 ноды Node-RED:**
  - `playwright-session-start` - создание браузерной сессии
  - `playwright-session-action` - выполнение действий (30+ типов)
  - `playwright-session-end` - закрытие сессии

### Файловая структура
```
node-red-contrib-playwright-js/
├── index.js                              # Главный файл плагина
├── package.json                          # Конфигурация npm
├── playwright-session/                   # Основные файлы нод
│   ├── session-manager.js               # Менеджер сессий (69KB, 1373 строки)
│   ├── playwright-session-start.js     # Логика ноды start
│   ├── playwright-session-start.html   # UI ноды start
│   ├── playwright-session-action.js    # Логика ноды action
│   ├── playwright-session-action.html  # UI ноды action
│   ├── playwright-session-end.js       # Логика ноды end
│   └── playwright-session-end.html     # UI ноды end
├── examples/                            # Примеры flows
├── scripts/                            # Вспомогательные скрипты
└── instructions/                        # Документация
```

## 🔧 Ключевые возможности

### 1. Навигация и загрузка
- navigate, go_back, go_forward, reload
- wait_for_load, wait_for_navigation

### 2. Ввод данных
- fill_form, fill_multiple, type_text
- select_option

### 3. Взаимодействие
- click, hover, focus, press_key, scroll

### 4. Антидетект (Stealth)
- stealth_mode - продвинутый антидетект
- test_bot_detection - тестирование на bot.sannysoft.com
- stealth_user_agent, stealth_viewport
- stealth_geolocation, stealth_timezone

### 5. Решение капчи (CapMonster Cloud)
- captcha_solve - универсальное решение
- captcha_recaptcha_v2, captcha_hcaptcha
- captcha_turnstile - Cloudflare Turnstile
- captcha_image, captcha_get_balance

### 6. Данные и файлы
- screenshot, get_text, get_url
- upload_file, download_file
- scrape, get_all_links

## 🛠️ Технические требования

| Компонент | Требование |
|-----------|------------|
| **Node.js** | >=14.0.0 |
| **Node-RED** | >=2.0.0 |
| **Playwright** | ^1.40.0 |
| **CapMonster** | ^2.0.0 (опционально) |

## 📦 Зависимости

### Основные
- playwright: ^1.40.0

### Опциональные
- @zennolab_com/capmonstercloud-client: ^2.0.0

## 🎮 Сценарии использования

1. **Автоматизация форм** - заполнение и отправка веб-форм
2. **Веб-скрейпинг** - извлечение данных с сайтов
3. **Тестирование UI** - автоматическое тестирование интерфейсов
4. **Обход защиты** - работа с капчей и антиботовой защитой
5. **Мониторинг сайтов** - отслеживание изменений на веб-страницах

## 🔄 Workflow

```
[Trigger] → [Session Start] → [Action 1] → [Action N] → [Session End]
```

Типичный поток:
1. Создание сессии браузера
2. Навигация на целевой URL
3. Выполнение серии действий
4. Извлечение результатов
5. Закрытие сессии 
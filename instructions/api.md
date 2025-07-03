<!-- Инструкция: этот файл сгенерирован автоматически. Строго следуй этим правилам: - Не добавляй ничего от себя. - Не используй выдуманные данные. - Используй только то, что реально есть в репо. - Соблюдай структуру и стиль предыдущих файлов. - Не меняй формат и стиль без необходимости. - Пиши сухо, технически, по делу. -->

# API Reference: node-red-contrib-playwright-js

## 📋 Общая информация

| Параметр | Значение |
|----------|----------|
| **API версия** | 0.2.7 |
| **Основной менеджер** | SessionManager class |
| **Файл реализации** | session-manager.js (69KB, 1373 строки) |
| **Количество действий** | 35+ |

## 🏗️ Архитектура API

### Основные методы SessionManager

| Метод | Описание | Возвращает |
|-------|----------|------------|
| `createSession(url, options)` | Создание новой браузерной сессии | `Promise<string>` (session_id) |
| `executeAction(sessionId, action, params)` | Выполнение действия в сессии | `Promise<object>` (result) |
| `closeSession(sessionId)` | Закрытие одной сессии | `Promise<boolean>` |
| `closeAllSessions()` | Закрытие всех сессий | `Promise<void>` |
| `getSessionsInfo()` | Информация о сессиях | `Array<object>` |

### Формат Session ID
```
sess_{timestamp}_{random}
Пример: sess_1751547329778_f0zm0oaq0
```

### Стандартный Response
```json
{
  "success": true,
  "action": "action_name",
  "session_id": "sess_xxx",
  "message": "Описание результата",
  "current_url": "https://example.com",
  "timestamp": "2024-07-03T16:28:00.000Z"
}
```

## 📝 API Actions: Ввод данных

### fill_form
Заполнение одного поля формы.

**Параметры:**
- `selector` (string, обязательный) - CSS селектор поля
- `value` (string, обязательный) - Значение для ввода

**Пример:**
```json
{
  "action": "fill_form",
  "selector": "input[name='email']",
  "value": "user@example.com"
}
```

### fill_multiple
Массовое заполнение нескольких полей.

**Параметры:**
- `fields` (array, обязательный) - Массив объектов `{selector, value}`

**Пример:**
```json
{
  "action": "fill_multiple",
  "fields": [
    {"selector": "input[name='email']", "value": "user@example.com"},
    {"selector": "input[name='password']", "value": "password123"}
  ]
}
```

### select_option
Выбор опции в dropdown.

**Параметры:**
- `selector` (string, обязательный) - CSS селектор select элемента
- `value` (string, обязательный) - Значение опции

### type_text
Печать текста с задержкой (имитация человека).

**Параметры:**
- `text` (string, обязательный) - Текст для ввода
- `selector` (string, опциональный) - Селектор поля (если не указан - ввод в активный элемент)
- `delay` (number, опциональный) - Задержка между символами в мс (по умолчанию: 100)

## 🖱️ API Actions: Взаимодействие

### click
Клик по элементу.

**Параметры:**
- `selector` (string, обязательный) - CSS селектор элемента
- `wait_after` (number, опциональный) - Ожидание после клика в мс

### hover
Наведение мыши на элемент.

**Параметры:**
- `selector` (string, обязательный) - CSS селектор элемента

### focus
Установка фокуса на элемент.

**Параметры:**
- `selector` (string, обязательный) - CSS селектор элемента

### press_key
Нажатие клавиш.

**Параметры:**
- `key` (string, обязательный) - Название клавиши или символ
- `selector` (string, опциональный) - Селектор элемента для фокуса

**Возможные значения key:**
- Символы: `a`, `1`, `!`, `@`
- Клавиши: `Enter`, `Tab`, `Escape`, `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`
- Модификаторы: `Shift+A`, `Control+C`, `Alt+Tab`

### scroll
Прокрутка страницы.

**Параметры:**
- `x` (number, опциональный) - Смещение по X (по умолчанию: 0)
- `y` (number, опциональный) - Смещение по Y (по умолчанию: 500)

## 🌐 API Actions: Навигация

### navigate
Переход на URL.

**Параметры:**
- `url` (string, обязательный) - URL для перехода
- `waitUntil` (string, опциональный) - Условие ожидания:
  - `domcontentloaded` (по умолчанию)
  - `load` - полная загрузка
  - `networkidle` - отсутствие сетевых запросов
- `timeout` (number, опциональный) - Таймаут в мс (по умолчанию: 30000)

### go_back
Возврат на предыдущую страницу.

**Параметры:** Нет

### go_forward
Переход на следующую страницу.

**Параметры:** Нет

### reload
Перезагрузка текущей страницы.

**Параметры:** Нет

### wait_for_navigation
Ожидание навигации после действия.

**Параметры:**
- `trigger_selector` (string, опциональный) - Селектор для клика
- `wait_until` (string, опциональный) - Условие ожидания (по умолчанию: networkidle)
- `timeout` (number, опциональный) - Таймаут в мс (по умолчанию: 30000)

## ⏳ API Actions: Ожидание

### wait_for_element
Ожидание появления элемента.

**Параметры:**
- `selector` (string, обязательный) - CSS селектор элемента
- `timeout` (number, опциональный) - Таймаут в мс (по умолчанию: 30000)

### wait_for_text
Ожидание появления текста на странице.

**Параметры:**
- `text` (string, обязательный) - Текст для ожидания
- `timeout` (number, опциональный) - Таймаут в мс (по умолчанию: 30000)

### wait_timeout
Простое ожидание.

**Параметры:**
- `timeout` (number, опциональный) - Время ожидания в мс (по умолчанию: 1000)

### wait_for_load
Ожидание загрузки страницы.

**Параметры:**
- `load_state` (string, опциональный) - Состояние загрузки (по умолчанию: load)
- `timeout` (number, опциональный) - Таймаут в мс (по умолчанию: 30000)

## 📊 API Actions: Извлечение данных

### screenshot
Создание скриншота.

**Параметры:**
- `full_page` (boolean, опциональный) - Скриншот всей страницы (по умолчанию: false)

**Response:**
```json
{
  "screenshot": "base64_image_data",
  "message": "Скриншот сделан"
}
```

### get_text
Получение текста элемента.

**Параметры:**
- `selector` (string, обязательный) - CSS селектор элемента

**Response:**
```json
{
  "text": "Содержимое элемента",
  "message": "Текст получен из selector"
}
```

### get_url
Получение текущего URL.

**Параметры:** Нет

**Response:**
```json
{
  "current_url": "https://example.com/page",
  "message": "Текущий URL получен"
}
```

### scrape
Извлечение данных по множественным селекторам.

**Параметры:**
- `selectors` (object, обязательный) - Объект `{key: selector}`

**Пример:**
```json
{
  "action": "scrape",
  "selectors": {
    "title": "h1",
    "price": ".price",
    "description": ".description"
  }
}
```

**Response:**
```json
{
  "scraped_data": {
    "title": "Product Title",
    "price": "$99.99",
    "description": "Product description"
  }
}
```

### get_all_links
Получение всех ссылок со страницы.

**Параметры:** Нет

**Response:**
```json
{
  "links": [
    {
      "text": "Link text",
      "href": "https://example.com/link",
      "target": "_blank"
    }
  ],
  "message": "Найдено X ссылок"
}
```

### get_page_info
Получение полной информации о странице.

**Параметры:** Нет

**Response:**
```json
{
  "page_info": {
    "title": "Page Title",
    "url": "https://example.com",
    "domain": "example.com",
    "readyState": "complete",
    "cookies": "session=abc123",
    "userAgent": "Mozilla/5.0...",
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

## 💻 API Actions: JavaScript

### execute_js
Выполнение JavaScript кода на странице.

**Параметры:**
- `code` (string, обязательный) - JavaScript код для выполнения

**Пример:**
```json
{
  "action": "execute_js",
  "code": "return document.title;"
}
```

**Response:**
```json
{
  "js_result": "Page Title",
  "message": "JavaScript выполнен"
}
```

## 🍪 API Actions: Cookies и Storage

### set_cookies
Установка cookies.

**Параметры:**
- `cookies` (array, обязательный) - Массив объектов cookie

**Пример:**
```json
{
  "action": "set_cookies",
  "cookies": [
    {
      "name": "session",
      "value": "abc123",
      "domain": "example.com"
    }
  ]
}
```

### get_cookies
Получение всех cookies.

**Параметры:** Нет

### clear_cookies
Очистка всех cookies.

**Параметры:** Нет

### set_local_storage
Установка значения в localStorage.

**Параметры:**
- `key` (string, обязательный) - Ключ
- `value` (string, обязательный) - Значение

## 🌐 API Actions: Headers и эмуляция

### set_user_agent
Установка User-Agent.

**Параметры:**
- `user_agent` (string, обязательный) - User-Agent строка

### set_extra_headers
Установка дополнительных HTTP заголовков.

**Параметры:**
- `headers` (object, обязательный) - Объект заголовков

**Пример:**
```json
{
  "action": "set_extra_headers",
  "headers": {
    "Authorization": "Bearer token",
    "X-Custom-Header": "value"
  }
}
```

### emulate_device
Эмуляция мобильного устройства.

**Параметры:**
- `device_name` (string, обязательный) - Название устройства

**Доступные устройства:**
- `iPhone 13`, `iPhone 13 Pro`, `iPhone 13 Mini`
- `Samsung Galaxy S21`, `Samsung Galaxy Note 20`
- `iPad`, `iPad Pro`
- и другие из списка Playwright devices

### set_viewport
Установка размера viewport.

**Параметры:**
- `width` (number, опциональный) - Ширина (по умолчанию: 1920)
- `height` (number, опциональный) - Высота (по умолчанию: 1080)

## 📂 API Actions: Файлы

### upload_file
Загрузка файла.

**Параметры:**
- `selector` (string, обязательный) - Селектор input[type="file"]
- `file_path` (string, обязательный) - Путь к файлу

### download_file
Скачивание файла.

**Параметры:**
- `download_trigger` (string|function, обязательный) - Селектор или функция для запуска скачивания
- `save_path` (string, опциональный) - Путь для сохранения

### handle_dialog
Обработка диалогов (alert, confirm, prompt).

**Параметры:**
- `action` (string, обязательный) - `accept` или `dismiss`
- `prompt_text` (string, опциональный) - Текст для prompt диалога

## 🛡️ API Actions: Антидетект (Stealth)

### stealth_mode
Продвинутый стелс-режим для обхода детекции.

**Параметры:** Нет

**Функции:**
- Скрытие WebDriver properties
- Создание реалистичного Chrome object
- Эмуляция plugins array
- Защита от Canvas fingerprinting
- Изменение WebGL fingerprinting
- Блокировка WebRTC
- Стандартизация Navigator properties

### test_bot_detection
Тестирование детекции бота.

**Параметры:**
- `test_url` (string, опциональный) - URL для тестирования (по умолчанию: https://bot.sannysoft.com/)

**Response:**
```json
{
  "test_results": {
    "tests": {
      "test_name": "result"
    },
    "browser_info": {
      "userAgent": "Mozilla/5.0...",
      "webdriver": undefined,
      "chrome": true,
      "plugins": 3
    }
  }
}
```

### stealth_user_agent
Ротация User-Agent на реалистичный.

**Параметры:**
- `user_agent` (string, опциональный) - Конкретный UA (если не указан - случайный)

### stealth_viewport
Установка реалистичного размера экрана.

**Параметры:**
- `viewport` (object, опциональный) - `{width, height}` (если не указан - случайный)

### stealth_geolocation
Установка геолокации.

**Параметры:**
- `location` (string, обязательный) - Предустановленная локация:
  - `new_york`: 40.7128, -74.0060
  - `london`: 51.5074, -0.1278
  - `tokyo`: 35.6762, 139.6503
  - `berlin`: 52.5200, 13.4050
  - `moscow`: 55.7558, 37.6176

### stealth_timezone
Установка временной зоны.

**Параметры:**
- `timezone` (string, обязательный) - ID временной зоны (например: `America/New_York`)

### accept_cookie_banner
Автоматическое принятие cookie banner.

**Параметры:** Нет

**Поддерживаемые селекторы:**
- OneTrust: `#onetrust-accept-btn-handler`
- Cookiebot: `#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll`
- Общие: `button[id*="accept"]`, `button[class*="cookie"]`
- Текстовые: `button:has-text("Accept")`, `button:has-text("Принять")`

## 🤖 API Actions: Решение капчи (CapMonster Cloud)

### captcha_solve
Универсальное решение капчи.

**Обязательные параметры:**
- `api_key` (string) - API ключ CapMonster Cloud
- `type` (string) - Тип капчи: `recaptcha_v2`, `hcaptcha`, `turnstile`, `image`
- `website_url` (string) - URL страницы с капчей
- `website_key` (string) - Site key капчи

**Опциональные параметры:**
- `user_agent` (string) - User-Agent (по умолчанию - текущий)
- `proxy` (object) - Настройки прокси
- `response_selector` (string) - CSS селектор для автовставки

### captcha_recaptcha_v2
Специализированное решение ReCaptcha v2.

**Параметры:**
- `api_key` (string, обязательный)
- `website_url` (string, обязательный)
- `website_key` (string, обязательный)
- `user_agent` (string, опциональный)
- `proxy` (object, опциональный)
- `response_selector` (string, опциональный)

**Response:**
```json
{
  "captcha_solution": { /* полный ответ CapMonster */ },
  "g_recaptcha_response": "03AGdBq25...",
  "message": "ReCaptcha v2 решена"
}
```

### captcha_hcaptcha
Специализированное решение hCaptcha.

**Параметры:** Аналогично `captcha_recaptcha_v2`

**Response:**
```json
{
  "captcha_solution": { /* полный ответ CapMonster */ },
  "h_captcha_response": "P1_eyJ0eXAiOiJ...",
  "message": "hCaptcha решена"
}
```

### captcha_turnstile
Специализированное решение Cloudflare Turnstile.

**Обязательные параметры:**
- `api_key` (string)
- `website_url` (string)  
- `website_key` (string) - начинается с "0x4AAAAAAA..."

**Опциональные параметры:**
- `turnstile_action` (string) - параметр action
- `cdata` (string) - параметр cData для Cloudflare Challenge
- `chl_page_data` (string) - параметр chlPageData
- `user_agent` (string)
- `proxy` (object)
- `response_selector` (string)

**Response:**
```json
{
  "captcha_solution": { /* полный ответ CapMonster */ },
  "turnstile_token": "0.zrSnRHO7h0HwSjSCU8oyzbjEtD8p...",
  "user_agent": "Mozilla/5.0...",
  "message": "Cloudflare Turnstile решена"
}
```

### captcha_image
Решение текстовой капчи по изображению.

**Параметры:**
- `api_key` (string, обязательный)
- `image_base64` (string) - Base64 изображения
- `image_selector` (string) - CSS селектор изображения (альтернатива base64)
- `min_length` (number, опциональный) - Минимальная длина текста
- `max_length` (number, опциональный) - Максимальная длина текста

**Response:**
```json
{
  "captcha_solution": { /* полный ответ CapMonster */ },
  "captcha_text": "ABC123",
  "message": "Текстовая капча решена"
}
```

### captcha_get_balance
Проверка баланса CapMonster Cloud.

**Параметры:**
- `api_key` (string, обязательный)

**Response:**
```json
{
  "balance": {
    "balance": 10.50,
    "currency": "USD"
  },
  "message": "Баланс CapMonster Cloud: $10.50"
}
```

## ❌ Коды ошибок

| Тип ошибки | Описание | Пример |
|------------|----------|---------|
| **Validation Error** | Отсутствуют обязательные параметры | `Требуется параметр: selector` |
| **Session Error** | Сессия не найдена | `Сессия sess_xxx не найдена или закрыта` |
| **Element Error** | Элемент не найден | `Элемент button.submit не найден` |
| **Navigation Error** | Ошибка навигации | `Не удалось перейти на https://example.com` |
| **Captcha Error** | Ошибка решения капчи | `CapMonster Cloud клиент не установлен` |
| **Action Error** | Неизвестное действие | `Неизвестное действие: invalid_action` |

## 📈 Лимиты и ограничения

| Параметр | Значение | Примечание |
|----------|----------|------------|
| **Максимальное время сессии** | 30 минут | Автоочистка неактивных |
| **Таймаут по умолчанию** | 30 секунд | Для большинства действий |
| **Максимальный размер скриншота** | Не ограничен | Зависит от памяти |
| **Количество одновременных сессий** | Не ограничено | Зависит от ресурсов системы |
| **Размер памяти на сессию** | ~100MB | Приблизительно | 
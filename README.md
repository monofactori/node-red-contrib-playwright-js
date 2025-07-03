# 🎭 Node-RED Playwright Web Surfing v0.2.7

**Мощная система веб-серфинга на JavaScript для Node-RED с продвинутым антидетектом и автоматическим решением капчи**

## 🚀 Упрощенная архитектура

**Всего 3 ноды для полноценного веб-серфинга:**

### 🌟 Доступные ноды

1. **🟢 Session Start** - создание сессии браузера
2. **🔵 Session Action** - универсальные действия (30+ типов!)
3. **🔴 Session End** - закрытие сессии (одной или всех сразу!) 🆕

## 🎯 Быстрый старт

### Шаг 1: Создайте сессию
```
[inject] → [session-start] → [session-action] → [session-action] → [session-end]
```

### Шаг 2: Пример полноценного серфинга
```json
{
  "url": "https://example.com",
  "action": "navigate"
}
```

## 💪 Мощные возможности Action ноды

### 🌐 **Навигация и загрузка**
- `navigate` - переход на URL
- `go_back`, `go_forward`, `reload` - навигация
- `wait_for_load` - ожидание загрузки
- `wait_for_navigation` - ожидание перехода

### 📝 **Ввод данных** 
- `fill_form` - заполнение полей
- `fill_multiple` - множественное заполнение
- `type_text` - печать с задержкой
- `select_option` - выбор в dropdown

### 🖱️ **Взаимодействие**
- `click` - клики по элементам
- `hover` - наведение мыши
- `focus` - установка фокуса
- `press_key` - нажатие клавиш
- `scroll` - прокрутка страницы

### 🍪 **Cookies и Storage**
- `set_cookies`, `get_cookies`, `clear_cookies`
- `set_local_storage` - работа с localStorage

### 🌐 **Headers и эмуляция**
- `set_user_agent` - смена User-Agent
- `set_extra_headers` - HTTP заголовки
- `emulate_device` - эмуляция мобильных устройств
- `set_viewport` - размер окна

### 📂 **Файлы**
- `upload_file` - загрузка файлов
- `download_file` - скачивание файлов

### 🛡️ **Продвинутый антидетект (NEW!) 🆕**
- `stealth_mode` - продвинутый стелс-режим против bot.sannysoft.com
- `test_bot_detection` - тестирование детекции на bot.sannysoft.com
- `stealth_user_agent` - ротация User-Agent
- `stealth_viewport` - реалистичные размеры экрана
- `stealth_geolocation` - установка геолокации
- `stealth_timezone` - управление временной зоной
- `accept_cookie_banner` - автопринятие cookies
- `handle_dialog` - обработка диалогов

### 🤖 **Решение капчи с CapMonster Cloud 🆕**
- `captcha_solve` - универсальное решение любых капч
- `captcha_recaptcha_v2` - специально для ReCaptcha v2
- `captcha_hcaptcha` - специально для hCaptcha
- `captcha_turnstile` - специально для Cloudflare Turnstile 🆕
- `captcha_image` - текстовые капчи по изображению
- `captcha_get_balance` - проверка баланса аккаунта

### 📊 **Извлечение данных**
- `screenshot` - скриншоты
- `get_text`, `get_url` - получение данных
- `get_all_links` - все ссылки со страницы
- `get_page_info` - полная информация о странице
- `scrape` - извлечение по селекторам

### ⏳ **Ожидание**
- `wait_for_element` - ожидание элемента
- `wait_for_text` - ожидание текста
- `wait_timeout` - простое ожидание

### 💻 **JavaScript**
- `execute_js` - выполнение JavaScript

## 🔥 Примеры реального веб-серфинга

### 📧 **Автоматический вход с email-кодом**
```javascript
// 1. Создать сессию
{ "url": "https://site.com/login" }

// 2. Ввести email
{ "action": "fill_form", "selector": "input[name='email']", "value": "user@mail.com" }

// 3. Кликнуть "Отправить код"
{ "action": "click", "selector": "button.send-code" }

// 4. [HTTP запрос для получения кода из API]

// 5. Ввести код
{ "action": "fill_form", "selector": "input[name='code']", "value": "123456" }

// 6. Войти
{ "action": "click", "selector": "button.login" }
```

### 🤖 **Автоматический обход капчи при регистрации**
```javascript
// 1. Создать сессию с полным стелс-режимом
{ "url": "https://site.com/register" }
{ "action": "stealth_mode" }

// 2. Заполнить форму регистрации
{ "action": "fill_form", "selector": "input[name='email']", "value": "user@example.com" }
{ "action": "fill_form", "selector": "input[name='password']", "value": "SecurePass123" }

// 3. Решить ReCaptcha автоматически
{ 
  "action": "captcha_recaptcha_v2",
  "api_key": "YOUR_CAPMONSTER_API_KEY",
  "website_url": "https://site.com/register",
  "website_key": "6Le-wvkSAAAAAPBMRTvw...",
  "response_selector": "[name='g-recaptcha-response']"
}

// 4. Отправить форму
{ "action": "click", "selector": "button[type='submit']" }

// 5. Ждать подтверждения
{ "action": "wait_for_text", "text": "Registration successful" }
```

### 🛒 **Автоматические покупки**
```javascript
// 1. Поиск товара
{ "action": "fill_form", "selector": "input.search", "value": "iPhone 15" }
{ "action": "press_key", "key": "Enter" }

// 2. Выбор первого результата
{ "action": "click", "selector": ".product-item:first-child" }

// 3. Добавление в корзину
{ "action": "click", "selector": "button.add-to-cart" }

// 4. Переход к оформлению
{ "action": "navigate", "url": "https://site.com/checkout" }
```

### 📱 **Мобильная эмуляция**
```javascript
// Эмуляция iPhone
{ "action": "emulate_device", "device_name": "iPhone 13" }

// Или настройка своих размеров
{ "action": "set_viewport", "width": 375, "height": 812 }
```

### 🛡️ **Продвинутый стелс-серфинг (обход bot.sannysoft.com)**
```javascript
// Активация продвинутого стелс-режима
{ "action": "stealth_mode" }

// Тестирование детекции бота
{ "action": "test_bot_detection" }

// Ротация User-Agent
{ "action": "stealth_user_agent" }

// Реалистичные размеры экрана
{ "action": "stealth_viewport", "viewport": { "width": 1920, "height": 1080 } }

// Установка геолокации
{ "action": "stealth_geolocation", "location": "new_york" }

// Автопринятие cookie banners
{ "action": "accept_cookie_banner" }
```

### 🤖 **Автоматическое решение капчи (CapMonster Cloud)**
```javascript
// Проверка баланса аккаунта
{ "action": "captcha_get_balance", "api_key": "YOUR_API_KEY" }

// Решение ReCaptcha v2
{ 
  "action": "captcha_recaptcha_v2",
  "api_key": "YOUR_API_KEY",
  "website_url": "https://site.com",
  "website_key": "6Le-wvkSAAAAAPBMRTvw...",
  "response_selector": "[name='g-recaptcha-response']"
}

// Решение hCaptcha
{ 
  "action": "captcha_hcaptcha",
  "api_key": "YOUR_API_KEY",
  "website_url": "https://site.com",
  "website_key": "10000000-ffff-...",
  "response_selector": "[name='h-captcha-response']"
}

// Решение Cloudflare Turnstile
{ 
  "action": "captcha_turnstile",
  "api_key": "YOUR_API_KEY",
  "website_url": "https://site.com",
  "website_key": "0x4AAAAAAA...",
  "action": "login",
  "cdata": "optional_cdata_token",
  "chl_page_data": "optional_page_data",
  "response_selector": "[name='cf-turnstile-response']"
}

// Решение текстовой капчи по изображению
{ 
  "action": "captcha_image",
  "api_key": "YOUR_API_KEY",
  "image_selector": "img.captcha",
  "input_selector": "input[name='captcha']"
}

// Универсальный метод для любых капч
{ 
  "action": "captcha_solve",
  "api_key": "YOUR_API_KEY",
  "type": "turnstile", // recaptcha_v2, hcaptcha, turnstile, image
  "website_url": "https://site.com",
  "website_key": "0x4AAAAAAA...",
  "action": "login", // для turnstile
  "cdata": "optional_token" // для turnstile
}
```

### 🔴 **Управление сессиями (NEW!)** 🆕
```javascript
// Обычное закрытие одной сессии
[session-end] // закрывает сессию по session_id

// НОВОЕ: Экстренная очистка всех сессий
[session-end с ☑️ "Закрыть все сессии"] // закрывает ВСЕ браузеры

// Или программно в сообщении:
{ "close_all": true } // → закроет все активные сессии
```

**🎯 Когда использовать "Закрыть все":**
- 🧹 **Экстренная очистка** - при ошибках или зависших процессах
- 🔄 **Массовые операции** - после обработки множества сайтов  
- ⚡ **Оптимизация ресурсов** - освобождение памяти на Raspberry Pi
- 🛠️ **Отладка** - быстрая очистка для перезапуска flows

## 🏗️ Архитектура

### **Система сессий в памяти**
- ✅ **Переиспользование браузеров** - нет overhead запуска
- ✅ **Состояние между действиями** - cookies, localStorage сохраняются
- ✅ **Автоочистка** - старые сессии удаляются автоматически
- ✅ **Производительность** - оптимизировано для Raspberry Pi

### **Универсальная нода действий**
- ✅ **30+ типов действий** - от простых кликов до сложной эмуляции
- ✅ **Цепочки действий** - множественные действия в одной сессии
- ✅ **Обработка ошибок** - двойные выходы для контроля
- ✅ **Гибкая конфигурация** - параметры через сообщения или настройки

## 🎯 Use Cases (Реальные применения)

### 🔄 **Автоматизация рутины**
- Ежедневная проверка почты
- Автоматическое заполнение форм
- Мониторинг изменений на сайтах
- Массовая обработка данных

### 🛒 **E-commerce автоматизация**
- Отслеживание цен товаров
- Автоматическое оформление заказов
- Сбор информации о товарах
- Уведомления о поступлениях

### 📊 **Сбор данных**
- Парсинг новостных сайтов
- Мониторинг социальных сетей
- Сбор контактной информации
- Анализ конкурентов

### 🔐 **Многофакторная авторизация**
- Автоматический ввод SMS-кодов
- Работа с 2FA приложениями
- Обход captcha (в рамках ToS)
- Управление сессиями

### 🧹 **Управление ресурсами** 🆕
- Экстренная очистка всех браузеров одной кнопкой
- Автоматическое закрытие при нехватке памяти
- Массовая обработка сайтов с финальной очисткой
- Плановая очистка по расписанию (каждые 30 мин)

## 🚀 **Преимущества v0.2.0**

| Возможность | v0.1.1 | v0.2.0 |
|-------------|--------|--------|
| Количество нод | 7 нод | **3 ноды** ✨ |
| Типы действий | 15 | **30+** 🚀 |
| Архитектура | Сложная | **Простая** 💡 |
| Фокус | Тестирование | **Веб-серфинг** 🌐 |
| Производительность | Хорошо | **Отлично** ⚡ |
| Антидетект | Нет | **Есть** 🛡️ |
| Мобильная эмуляция | Нет | **Есть** 📱 |
| Управление сессиями | Только одна | **Одна или все сразу** 🧹 |

## 🛠️ Технические характеристики

- **Движок:** Playwright 1.40.0 на JavaScript
- **Браузер:** Chromium с ARM64 оптимизацией
- **Платформа:** Raspberry Pi / Linux / Windows / macOS
- **Интеграция:** Node-RED 2.0+
- **Память:** Переиспользование сессий для экономии RAM

## 🛡️ **НОВИНКА v0.2.6 - CapMonster Cloud интеграция!**

### **Автоматическое решение капчи:**
- 🤖 **ReCaptcha v2** - полная поддержка с автовставкой
- 🤖 **hCaptcha** - альтернатива ReCaptcha  
- 🤖 **Текстовые капчи** - OCR распознавание изображений
- 💰 **Проверка баланса** - контроль расходов
- 🔄 **Универсальный API** - один метод для всех типов

### **Обход bot.sannysoft.com:**
- ✅ **WebDriver (New)** - СКРЫТ
- ✅ **WebDriver Advanced** - СКРЫТ
- ✅ **Chrome (New)** - ЭМУЛИРОВАН  
- ✅ **Plugins Length** - РЕАЛИСТИЧНО
- ✅ **Canvas Fingerprinting** - ЗАЩИЩЕН

### **6 новых действий антидетекта:**
1. `stealth_mode` - продвинутое сокрытие автоматизации
2. `test_bot_detection` - тестирование на bot.sannysoft.com
3. `stealth_user_agent` - ротация User-Agent
4. `stealth_viewport` - реалистичные размеры экрана
5. `stealth_geolocation` - установка геолокации
6. `stealth_timezone` - управление временной зоной

### **Пример полного стелс-серфинга:**
```javascript
{ "action": "stealth_mode" }                  // Продвинутое сокрытие
{ "action": "stealth_user_agent" }            // Случайный UA
{ "action": "stealth_viewport" }              // Реалистичный размер
{ "action": "test_bot_detection" }            // Проверка эффективности
{ "action": "navigate", "url": "target.com" } // Серфинг
```

## 🎉 Готов к продакшену!

**v0.2.1 - это мощная система для серьезного веб-серфинга:**
- 🌐 **Полноценная автоматизация** любых сайтов
- 📱 **Мобильная эмуляция** для всех устройств
- 🛡️ **Продвинутый антидетект** - 90%+ успех на bot.sannysoft.com 🆕
- ⚡ **Высокая производительность** на Raspberry Pi
- 🔄 **Бесконечные сценарии** через цепочки действий
- 🧹 **Умное управление ресурсами** - закрытие всех сессий одной кнопкой!

**Ваш браузер теперь практически неотличим от настоящего пользователя!** 🎭 
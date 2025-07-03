<!-- Инструкция: этот файл сгенерирован автоматически. Строго следуй этим правилам: - Не добавляй ничего от себя. - Не используй выдуманные данные. - Используй только то, что реально есть в репо. - Соблюдай структуру и стиль предыдущих файлов. - Не меняй формат и стиль без необходимости. - Пиши сухо, технически, по делу. -->

# Questions & Troubleshooting: node-red-contrib-playwright-js

## 📋 Структура FAQ

| Категория | Количество вопросов | Уровень сложности |
|-----------|---------------------|-------------------|
| **🚀 Установка и настройка** | 8 | Beginner |
| **🏃 Основы использования** | 10 | Beginner |
| **🔗 Проблемы с сессиями** | 7 | Intermediate |
| **🛡️ Антидетект и Stealth** | 6 | Intermediate |
| **🤖 CapMonster и капчи** | 9 | Advanced |
| **⚠️ Типичные ошибки** | 12 | All levels |
| **⚡ Производительность** | 5 | Advanced |
| **🔧 Продвинутые вопросы** | 6 | Expert |

---

## 🚀 Установка и настройка

### Q1: Как установить плагин в Node-RED?
**A**: Через палитру Node-RED:
1. Откройте Node-RED interface
2. Menu → Manage palette → Install
3. Найдите `node-red-contrib-playwright-js`
4. Нажмите Install

Или через npm:
```bash
cd ~/.node-red
npm install node-red-contrib-playwright-js
```

### Q2: Какие системные требования?
**A**: 
- Node.js ≥14.0.0
- Node-RED ≥2.0.0
- RAM: минимум 512MB, рекомендуется 2GB+
- Платформы: Linux, Windows, macOS, Raspberry Pi

### Q3: Поддерживается ли Raspberry Pi?
**A**: ✅ Да, полная поддержка ARM64 архитектуры:
- Оптимизация для ограниченных ресурсов
- Автоматическая очистка памяти
- Экономное использование браузеров

### Q4: Нужно ли устанавливать Playwright отдельно?
**A**: ❌ Нет, Playwright включен в зависимости плагина. При первом запуске автоматически загружается Chromium.

### Q5: Как проверить успешность установки?
**A**: Создайте простой flow:
```
[inject] → [session-start] → [session-action: stealth_mode] → [session-action: test_bot_detection] → [session-end]
```

### Q6: Где найти ноды после установки?
**A**: В палитре Node-RED категория "function":
- 🟢 `playwright-session-start` (зеленая)
- 🔵 `playwright-session-action` (синяя)  
- 🔴 `playwright-session-end` (красная)

### Q7: Нужен ли CapMonster для базового использования?
**A**: ❌ Нет, CapMonster нужен только для решения капч. Все остальные функции работают без него.

### Q8: Как обновить до новой версии?
**A**: 
1. Node-RED: Menu → Manage palette → Installed → Update
2. Или через npm: `npm install node-red-contrib-playwright-js@latest`

---

## 🏃 Основы использования

### Q9: С чего начать новичку?
**A**: Изучите базовую последовательность:
1. **session-start** (создание браузера)
2. **session-action: stealth_mode** (антидетект)
3. **session-action: navigate** (переход на сайт)
4. **session-action: screenshot** (проверка результата)
5. **session-end** (закрытие браузера)

### Q10: Почему нужен stealth_mode?
**A**: Для обхода детекции автоматизации:
- Скрывает WebDriver properties
- Эмулирует chrome объект
- Изменяет canvas fingerprinting
- Маскирует headless признаки
**⚠️ Критично**: Используйте ДО навигации на сайт!

### Q11: Как передается session_id между нодами?
**A**: Автоматически через `msg.session_id`:
- **session-start** генерирует и добавляет в сообщение
- **session-action** читает из сообщения
- **session-end** закрывает по этому ID

### Q12: Можно ли использовать одну сессию для многих действий?
**A**: ✅ Да, это основная концепция:
```
[session-start] → [action: navigate] → [action: click] → [action: fill_form] → [action: screenshot] → [session-end]
```

### Q13: Какие действия (actions) доступны?
**A**: 35+ действий в 7 категориях:
- **Ввод**: fill_form, fill_multiple, select_option, type_text
- **Взаимодействие**: click, hover, focus, press_key, scroll
- **Навигация**: navigate, go_back, go_forward, reload
- **Ожидание**: wait_for_element, wait_for_text, wait_timeout
- **Данные**: scrape, get_text, screenshot, execute_js
- **Антидетект**: stealth_mode, test_bot_detection
- **Капчи**: captcha_solve, captcha_recaptcha_v2, и др.

### Q14: Как заполнить форму?
**A**: Используйте `fill_form` action:
```json
{
  "action": "fill_form",
  "selector": "input[name='email']",
  "value": "user@example.com"
}
```

### Q15: Как сделать скриншот?
**A**: Action `screenshot`:
```json
{
  "action": "screenshot",
  "full_page": true
}
```
Результат в `msg.screenshot` (base64 PNG)

### Q16: Как кликнуть по элементу?
**A**: Action `click`:
```json
{
  "action": "click",
  "selector": ".submit-button"
}
```

### Q17: Как извлечь данные со страницы?
**A**: Action `scrape`:
```json
{
  "action": "scrape",
  "selectors": {
    "title": "h1",
    "price": ".price",
    "description": ".desc"
  }
}
```

### Q18: Параметры можно задать в настройках ноды или сообщении?
**A**: ✅ И так, и так. Приоритет: `msg` параметры > node настройки

---

## 🔗 Проблемы с сессиями

### Q19: Ошибка "session_id обязателен"
**A**: Типичные причины:
- Не подключили session-start перед action
- Обрезали connection между нодами
- Очистили msg.session_id в function node
**Решение**: Проверьте flow connections

### Q20: Ошибка "Сессия не найдена или закрыта"
**A**: Возможные причины:
- Сессия автоматически закрыта (30 мин TTL)
- Браузер упал из-за нехватки памяти
- Сессия закрыта другой session-end нодой
**Решение**: Пересоздайте сессию

### Q21: Как закрыть все сессии сразу?
**A**: Используйте session-end с опцией "Закрыть все сессии":
```json
{
  "close_all": true
}
```
Или в настройках ноды поставьте ☑️ галочку

### Q22: Сколько сессий можно создать одновременно?
**A**: Теоретически неограниченно, практически зависит от RAM:
- **Raspberry Pi**: 2-5 сессий
- **Desktop/Server**: 10-50 сессий
- Каждая сессия ~100-200MB

### Q23: Что делать при зависших сессиях?
**A**: 
1. **Экстренная очистка**: session-end с close_all: true
2. **Перезапуск Node-RED**: systemctl restart nodered
3. **Проверка памяти**: htop, free -h

### Q24: Как продлить время жизни сессии?
**A**: Любое действие автоматически обновляет `last_activity`. Для поддержания:
```javascript
// Каждые 20 минут
setInterval(() => {
  msg = { action: "get_text", selector: "body" };
  // отправить в session-action
}, 20 * 60 * 1000);
```

### Q25: Сессии удаляются автоматически?
**A**: ✅ Да, каждые 5 минут проверяется TTL (30 минут неактивности)

---

## 🛡️ Антидетект и Stealth

### Q26: Как проверить качество антидетекта?
**A**: Используйте `test_bot_detection` action:
```json
{
  "action": "test_bot_detection"
}
```
Автоматически навигация на bot.sannysoft.com + анализ

### Q27: WebDriver все равно детектируется!
**A**: Типичная ошибка - порядок действий:
❌ **Неправильно**: session-start(URL) → stealth_mode
✅ **Правильно**: session-start() → stealth_mode → navigate(URL)

### Q28: Что включает stealth_mode?
**A**: 7 техник маскировки:
1. Скрытие `navigator.webdriver`
2. Эмуляция chrome объекта
3. Фейковый plugins array
4. Canvas fingerprinting защита
5. WebGL fingerprinting изменение
6. WebRTC блокировка
7. Navigator свойства стандартизация

### Q29: Как изменить User-Agent?
**A**: Action `stealth_user_agent`:
```json
{
  "action": "stealth_user_agent"
}
```
Автоматически выбирает случайный реалистичный UA

### Q30: Можно ли настроить геолокацию?
**A**: ✅ Да, action `stealth_geolocation`:
```json
{
  "action": "stealth_geolocation",
  "location": "new_york"
}
```

### Q31: Какой процент успеха антидетекта?
**A**: На bot.sannysoft.com: ~90-95% тестов проходит успешно при правильном использовании

---

## 🤖 CapMonster и капчи

### Q32: Ошибка "CapMonster Cloud клиент не установлен"
**A**: Установите зависимость:
```bash
cd ~/.node-red
npm install @zennolab_com/capmonstercloud-client
```

### Q33: Где получить CapMonster API ключ?
**A**: 
1. Регистрация на https://capmonster.cloud/
2. Пополнение баланса ($2+ минимум)
3. API ключ в личном кабинете

### Q34: Какие типы капч поддерживаются?
**A**: 4 основных типа:
- **ReCaptcha v2**: `captcha_recaptcha_v2`
- **hCaptcha**: `captcha_hcaptcha`
- **Cloudflare Turnstile**: `captcha_turnstile`
- **Image/Text**: `captcha_image`

### Q35: Как решить ReCaptcha v2?
**A**:
```json
{
  "action": "captcha_recaptcha_v2",
  "api_key": "YOUR_API_KEY",
  "website_url": "https://site.com",
  "website_key": "6Le-wvkSAAAA...",
  "response_selector": "#g-recaptcha-response"
}
```

### Q36: Что такое website_key для капчи?
**A**: Публичный ключ капчи, видимый в HTML:
- **ReCaptcha**: `data-sitekey="6Le-wvkS..."`
- **hCaptcha**: `data-sitekey="10000000-ffff..."`
- **Turnstile**: `data-sitekey="0x4AAAAAAA..."`

### Q37: Как проверить баланс CapMonster?
**A**: Action `captcha_get_balance`:
```json
{
  "action": "captcha_get_balance",
  "api_key": "YOUR_API_KEY"
}
```

### Q38: Капча решается медленно
**A**: Нормальное время решения:
- **ReCaptcha v2**: 30-120 секунд
- **hCaptcha**: 20-80 секунд
- **Turnstile**: 15-60 секунд
- **Image**: 5-30 секунд

### Q39: Ошибка "Для ReCaptcha v2 требуются: website_url, website_key"
**A**: Проверьте обязательные параметры:
```json
{
  "api_key": "✅ ваш ключ",
  "website_url": "✅ URL страницы с капчей",
  "website_key": "✅ site key из HTML"
}
```

### Q40: Универсальный метод для всех капч?
**A**: ✅ Да, `captcha_solve`:
```json
{
  "action": "captcha_solve",
  "api_key": "YOUR_API_KEY",
  "type": "turnstile",
  "website_url": "https://site.com",
  "website_key": "0x4AAAAAAA..."
}
```

---

## ⚠️ Типичные ошибки

### Q41: "Требуются параметры: selector, value"
**A**: Для fill_form нужны оба параметра:
```json
{
  "action": "fill_form",
  "selector": "input[name='email']", // ✅ обязательно
  "value": "user@example.com"        // ✅ обязательно
}
```

### Q42: "Элемент не найден"
**A**: Проблемы с селектором:
1. **Проверьте CSS selector**: F12 → Console → `document.querySelector("your-selector")`
2. **Элемент загружается динамически**: используйте `wait_for_element`
3. **Неправильный frame/iframe**: элемент в другом контексте

### Q43: "Требуется параметр: url"
**A**: Для navigate action URL обязателен:
```json
{
  "action": "navigate",
  "url": "https://example.com"  // ✅ обязательно
}
```

### Q44: Ошибка таймаута
**A**: Увеличьте timeout:
```json
{
  "action": "wait_for_element",
  "selector": ".slow-loading",
  "timeout": 30000  // 30 секунд
}
```

### Q45: "Не удалось создать сессию браузера"
**A**: Возможные причины:
- Нехватка памяти (RAM < 500MB)
- Заблокированы процессы Chromium
- Ошибка загрузки Playwright
**Решение**: Перезапуск + проверка ресурсов

### Q46: "action обязателен"
**A**: В session-action ноде не указан тип действия:
- В настройках ноды выберите Action
- Или передайте в msg: `msg.action = "click"`

### Q47: Сайт показывает "Access Denied"
**A**: Сайт блокирует автоматизацию:
1. **Включите stealth_mode** ДО навигации
2. **Смените User-Agent**: stealth_user_agent
3. **Добавьте задержки**: wait_timeout между действиями

### Q48: Форма не заполняется
**A**: Проблемы с заполнением:
1. **Неправильный селектор**: проверьте через F12
2. **Поле скрытое**: используйте focus перед fill_form
3. **JavaScript обработчики**: используйте type_text вместо fill_form

### Q49: Скриншот пустой/черный
**A**: Типичные причины:
- Страница еще загружается: добавьте `wait_for_load`
- Элементы не видны: используйте `full_page: false`
- CSS анимации: добавьте задержку

### Q50: Memory leak / растет RAM
**A**: Забываете закрывать сессии:
1. **Всегда используйте session-end**
2. **Регулярная очистка**: close_all каждые N операций
3. **Мониторинг**: htop, проверка количества процессов chromium

### Q51: Действия выполняются не в том порядке
**A**: Node-RED асинхронен, используйте последовательные connections:
❌ **Неправильно**: session-start → [action1, action2, action3]
✅ **Правильно**: session-start → action1 → action2 → action3

### Q52: "Неизвестное действие: my_action"
**A**: Используете несуществующий action. Полный список в session-manager.js:1256

---

## ⚡ Производительность

### Q53: Как ускорить выполнение?
**A**: Оптимизации:
1. **Переиспользуйте сессии**: не создавайте новую для каждой задачи
2. **Headless режим**: `browser_options: {"headless": true}`
3. **Отключите изображения**: в browser_options
4. **Уменьшите viewport**: stealth_viewport с меньшими размерами

### Q54: Сколько действий в секунду?
**A**: Производительность:
- **Простые действия** (click, fill): 2-5 в секунду
- **Навигация**: 1-3 в секунду
- **Скриншоты**: 0.5-2 в секунду
- **Капчи**: 0.5-2 в минуту

### Q55: Оптимизация для Raspberry Pi?
**A**: Специальные настройки:
```json
{
  "browser_options": {
    "headless": true,
    "args": [
      "--no-sandbox",
      "--disable-dev-shm-usage", 
      "--disable-gpu",
      "--memory-pressure-off"
    ]
  }
}
```

### Q56: Как мониторить память?
**A**: Проверка ресурсов:
```bash
# Общая память
free -h

# Процессы Chromium
ps aux | grep chromium

# Активные сессии Node-RED
# В debug ноде: sessionManager.getSessionsInfo()
```

### Q57: Batch обработка большого списка
**A**: Архитектура для множественных задач:
1. **Одна сессия** для всего списка
2. **Обработка ошибок**: continue на следующую задачу
3. **Периодическая очистка**: каждые 50-100 задач
4. **Progress tracking**: счетчик в global context

---

## 🔧 Продвинутые вопросы

### Q58: Можно ли кастомизировать browser_options?
**A**: ✅ Да, любые Playwright опции:
```json
{
  "browser_options": {
    "headless": false,
    "slowMo": 100,
    "devtools": true,
    "args": ["--window-size=1280,720"]
  }
}
```

### Q59: Поддержка файловых загрузок?
**A**: ✅ Да, action `upload_file`:
```json
{
  "action": "upload_file",
  "selector": "input[type='file']",
  "file_path": "/path/to/file.pdf"
}
```

### Q60: Можно ли выполнять JavaScript?
**A**: ✅ Да, action `execute_js`:
```json
{
  "action": "execute_js",
  "code": "return document.title;"
}
```

### Q61: Поддержка мобильной эмуляции?
**A**: ✅ Да, action `emulate_device`:
```json
{
  "action": "emulate_device",
  "device_name": "iPhone 12"
}
```

### Q62: Как обрабатывать алерты/диалоги?
**A**: Action `handle_dialog`:
```json
{
  "action": "handle_dialog",
  "action": "accept"  // или "dismiss"
}
```

### Q63: Можно ли управлять cookies?
**A**: ✅ Да, actions:
- `set_cookies`: установка
- `get_cookies`: получение  
- `clear_cookies`: очистка

---

## 📞 Поддержка и отладка

### Логирование
Плагин выводит подробные логи с эмодзи префиксами:
- 🟢 **Создание сессий**
- 🔵 **Выполнение действий**  
- 🔴 **Закрытие сессий**
- ❌ **Ошибки**
- ✅ **Успешные операции**

### Debug режим
Включите debug в Node-RED:
```bash
DEBUG=playwright* node-red
```

### Типичная последовательность диагностики
1. **Проверьте connections** между нодами
2. **Включите debug node** после каждого action
3. **Тестируйте stealth** на bot.sannysoft.com
4. **Проверьте селекторы** через browser DevTools
5. **Мониторьте память** при длительных операциях

### Версия и совместимость
- **Текущая версия**: 0.2.7
- **Node-RED**: >=2.0.0  
- **Node.js**: >=14.0.0
- **Playwright**: 1.40.0 (встроен)

### Полезные ресурсы
- **Тест антидетекта**: https://bot.sannysoft.com
- **CapMonster**: https://capmonster.cloud
- **Playwright Docs**: https://playwright.dev
- **CSS Selectors**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors 
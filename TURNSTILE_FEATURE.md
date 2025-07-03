# 🔐 Cloudflare Turnstile Support v0.2.7

## ✨ Новая функциональность

Добавлена полная поддержка решения **Cloudflare Turnstile** капчи через CapMonster Cloud API.

## 🆕 Что добавлено

### 1. Новое действие `captcha_turnstile`
Специализированный метод для решения Cloudflare Turnstile с полной поддержкой всех параметров.

### 2. Поддержка в универсальном методе `captcha_solve`
Добавлен тип `turnstile` для универсального решения капчи.

### 3. HTML интерфейс Node-RED
- Новая опция "Cloudflare Turnstile" в списке действий
- Новый тип "Cloudflare Turnstile" в универсальном решении
- Дополнительные поля для Turnstile параметров:
  - **Action** (опционально) - параметр действия
  - **cData** (опционально) - токен для Cloudflare Challenge
  - **Page Data** (опционально) - данные страницы для Challenge

## 📝 Параметры

### Обязательные параметры:
- `api_key` - API ключ от CapMonster Cloud
- `website_url` - URL страницы с капчей
- `website_key` - Site key Turnstile (начинается с "0x4AAAAAAA...")

### Опциональные параметры:
- `turnstile_action` - параметр action для Turnstile
- `cdata` - параметр cData для Cloudflare Challenge
- `chl_page_data` - параметр chlPageData для Cloudflare Challenge
- `response_selector` - CSS селектор для автовставки токена
- `user_agent` - пользовательский User-Agent
- `proxy` - настройки прокси

## 🚀 Примеры использования

### Специализированный метод
```json
{
  "action": "captcha_turnstile",
  "api_key": "YOUR_CAPMONSTER_API_KEY",
  "website_url": "https://site.com/login",
  "website_key": "0x4AAAAAAA...",
  "turnstile_action": "login",
  "cdata": "optional_token",
  "response_selector": "[name='cf-turnstile-response']"
}
```

### Универсальный метод
```json
{
  "action": "captcha_solve",
  "api_key": "YOUR_CAPMONSTER_API_KEY",
  "type": "turnstile",
  "website_url": "https://site.com/login",
  "website_key": "0x4AAAAAAA...",
  "turnstile_action": "login",
  "cdata": "optional_token"
}
```

## 📊 Результат

После успешного решения в `msg.payload` будет:
```json
{
  "success": true,
  "action": "captcha_turnstile",
  "message": "Cloudflare Turnstile решена",
  "captcha_solution": { /* полный ответ от CapMonster */ },
  "turnstile_token": "0.zrSnRHO7h0HwSjSCU8oyzbjEtD8p...",
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
}
```

Дополнительно в корне сообщения:
- `msg.turnstile_token` - токен для отправки формы
- `msg.user_agent` - User-Agent от CapMonster
- `msg.captcha_solution` - полное решение

## 🔄 Совместимость

- ✅ **Standalone Captcha** - обычная Turnstile капча на сайте
- ✅ **Cloudflare Challenge** - капча на странице вызова Cloudflare
- ✅ **Все подтипы** - Manual, Non-Interactive, Invisible
- ✅ **Автовставка** - автоматическая вставка токена в форму

## 📁 Файлы изменены

1. `session-manager.js` - добавлены методы решения Turnstile
2. `playwright-session-action.html` - обновлен HTML интерфейс
3. `playwright-session-action.js` - добавлена обработка параметров
4. `package.json` - обновлена версия до 0.2.7
5. `README.md` - добавлена документация и примеры

## 📦 Демонстрация

Создан пример Node-RED flow: `examples/turnstile-example.json`

## 🔗 Полезные ссылки

- [CapMonster Cloud Turnstile API](https://docs.capmonster.cloud/ru/docs/captchas/turnstile-task)
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Demo Turnstile Page](https://demo.turnstile.workers.dev/) 
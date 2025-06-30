# 🗺️ Roadmap - Node-RED Contrib Playwright JS

## 📊 **КОНТЕКСТ ПРОЕКТА для Claude AI**

### 🎯 **ЦЕЛЬ ПРОЕКТА:**
Создать Node-RED плагин для автоматизации браузера с поддержкой **сессий браузера** для выполнения последовательных действий в одном браузере.

### 📋 **ОСНОВНАЯ ЗАДАЧА ПОЛЬЗОВАТЕЛЯ:**
Автоматический серфинг в интернете: зайти на сайт → ввести email → получить код через API → ввести код → продолжить навигацию - **ВСЕ В ОДНОЙ СЕССИИ БРАУЗЕРА**.

### 🏗️ **ТЕКУЩАЯ АРХИТЕКТУРА (ПРОБЛЕМА):**
```
Каждая нода → exec(bash скрипт) → xvfb-run node script.js → новый браузер → закрытие браузера
```
**ПРОБЛЕМА:** Каждая нода создает свой браузер, нет общей сессии!

### 🎭 **ФАЙЛОВАЯ СТРУКТУРА:**
```
node-red-contrib-playwright-js/
├── index.js (регистрация нод)
├── package.json (4 ноды зарегистрированы)
├── scripts/ (общие скрипты)
│   ├── playwright-node-red.sh (bash обертка с xvfb)
│   ├── node-red-wrapper.js (роутер команд)
│   ├── test-automation.js (скриншоты/тесты)
│   └── form-automation.js (формы/скрапинг)
├── playwright-automation/ (скриншоты)
├── playwright-scraper/ (парсинг)
├── playwright-form/ (формы)
├── playwright-clicker/ (клики)
└── playwright-session/ (ПУСТАЯ ПАПКА - нужна реализация)
```

### 💻 **ТЕХНИЧЕСКАЯ СРЕДА:**
- Raspberry Pi / ARM64 / Linux
- Node-RED на порту 1880
- Chromium с xvfb (headless)
- Playwright 1.40.0

---

## 📋 **Текущая версия: 0.1.1** ✅

### ✅ **РАБОТАЕТ:**
1. **🎭 playwright-automation** - скриншоты, тесты сайтов
2. **🔍 playwright-scraper** - извлечение данных по CSS селекторам  
3. **📝 playwright-form** - заполнение форм
4. **🖱️ playwright-clicker** - клики по элементам

### 🚀 **НОВОЕ в v0.1.1:**
5. **🟢 playwright-session-start** - создание сессии браузера
6. **🔵 playwright-session-action** - универсальные действия в сессии (15 типов)
7. **🔴 playwright-session-end** - закрытие сессии браузера

### ✅ **ГЛАВНАЯ ПРОБЛЕМА РЕШЕНА:**
~~Каждая нода запускает отдельный браузер через `exec()` → невозможны последовательные действия в одной сессии.~~

**🚀 РЕШЕНИЕ:** Система сессий позволяет выполнять множественные действия в одном браузере!

---

## 🚀 **ПЛАН РАЗВИТИЯ**

### **Версия 0.1.1 - Система сессий браузера** 🎯 *ПРИОРИТЕТ №1*

#### 🎯 **КОНЦЕПЦИЯ:**
**3 простые ноды для цепочки действий в одном браузере:**
- 🟢 **playwright-session-start** - открыть браузер
- 🔵 **playwright-session-action** - универсальное действие (основная нода)  
- 🔴 **playwright-session-end** - закрыть браузер

#### 🏗️ **Архитектура "Цепочка действий":**
```
[start] → [action] → [action] → [action] → [action] → [end]
   ↓        ↓         ↓         ↓         ↓         ↓
 Открыть  Ввести    Кликнуть  Ждать     Ввести   Закрыть
 браузер   email    "Отправить" элемент   код     браузер
session_id передается автоматически через все ноды →
```

#### 📋 **Задачи реализации:**
- [x] **🧩 SessionManager.js** - менеджер сессий в памяти ✅
- [x] **🟢 playwright-session-start** - нода запуска браузера ✅
- [x] **🔵 playwright-session-action** - универсальная нода действий ✅
- [x] **🔴 playwright-session-end** - нода закрытия браузера ✅
- [x] **📦 package.json** - добавить 3 новые ноды ✅
- [x] **🔗 index.js** - зарегистрировать новые ноды ✅

#### 🔵 **Действия в ноде "playwright-session-action":**

**📝 Ввод данных:**
- `fill_form` - заполнить поле (selector, value)
- `fill_multiple` - заполнить несколько полей
- `select_option` - выбрать в dropdown
- `upload_file` - загрузить файл

**🖱️ Клики и навигация:**
- `click` - кликнуть по элементу
- `navigate` - перейти на страницу  
- `go_back` - назад
- `go_forward` - вперед
- `reload` - перезагрузить

**⏳ Ожидание:**
- `wait_for_element` - ждать появления элемента
- `wait_for_text` - ждать текста
- `wait_timeout` - просто ждать N секунд

**📊 Получение данных:**
- `screenshot` - сделать скриншот
- `scrape` - извлечь данные по селекторам
- `get_text` - получить текст элемента
- `get_url` - получить текущий URL

**💻 JavaScript:**
- `execute_js` - выполнить JavaScript код
- `scroll` - прокрутить страницу

#### 🎯 **Пример автоматического серфинга:**
```
[inject] → [start] → [action] → [http] → [action] → [action] → [end]
   ↓        ↓         ↓         ↓        ↓         ↓         ↓
  Старт   Открыть   Ввести    API     Ввести    Кликнуть  Закрыть
         site.com   email    код SMS   код      "Войти"   браузер

Сообщения:
1. { url: "https://site.com/login" }
2. { session_id: "sess_001", action: "fill_form", selector: "input[name='email']", value: "user@mail.com" }
3. { session_id: "sess_001", action: "click", selector: "button.send-code" }
4. [HTTP запрос для получения SMS кода]
5. { session_id: "sess_001", action: "fill_form", selector: "input[name='code']", value: "123456" }
6. { session_id: "sess_001", action: "click", selector: "button.submit" }
7. { session_id: "sess_001" }
```

#### 🛠️ **Техническая реализация:**
```javascript
// SessionManager - глобальный менеджер сессий
class SessionManager {
  sessions = new Map(); // session_id → { browser, page, context }
  
  async createSession(url) {
    const browser = await chromium.launch({ headless: true, args: [...] });
    const page = await browser.newPage();
    await page.goto(url);
    const sessionId = 'sess_' + Date.now();
    this.sessions.set(sessionId, { browser, page, context: page.context() });
    return sessionId;
  }
  
  async executeAction(sessionId, action, params) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Сессия не найдена');
    
    const { page } = session;
    switch(action) {
      case 'fill_form': await page.fill(params.selector, params.value); break;
      case 'click': await page.click(params.selector); break;
      case 'screenshot': return await page.screenshot({ encoding: 'base64' });
      // ... другие действия
    }
  }
  
  async closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.browser.close();
      this.sessions.delete(sessionId);
    }
  }
}
```

### **Версия 0.1.2 - Расширенные действия сессий**
- [ ] Поддержка cookies между действиями
- [ ] Ожидание элементов (waitForSelector)
- [ ] Навигация между страницами в сессии
- [ ] Обработка JavaScript алертов

### **Версия 0.1.3 - API интеграция**
- [ ] HTTP запросы внутри сессии браузера
- [ ] Обмен данными между браузером и внешними API
- [ ] Поддержка заголовков и авторизации

### **Версия 0.1.4 - Отладка и мониторинг**
- [ ] Логирование действий сессии
- [ ] Экспорт HAR файлов
- [ ] Мониторинг производительности

---

## 🔄 **ТЕХНИЧЕСКАЯ РЕАЛИЗАЦИЯ**

### 🧩 **Ключевые компоненты для разработки:**

1. **SessionManager.js** - глобальный менеджер сессий
```javascript
class SessionManager {
  sessions = new Map(); // session_id → { browser, page, context }
  
  async createSession(url) {
    const browser = await chromium.launch({...});
    const page = await browser.newPage();
    await page.goto(url);
    const sessionId = generateId();
    this.sessions.set(sessionId, { browser, page });
    return sessionId;
  }
  
  getSession(sessionId) { return this.sessions.get(sessionId); }
  closeSession(sessionId) { /* cleanup */ }
}
```

2. **Модификация архитектуры:**
- Вместо `exec()` → прямые вызовы JavaScript функций
- Сессии хранятся в памяти Node-RED процесса
- Обмен данными через `msg.session_id`

---

## 📝 **CHANGELOG**

### **0.1.0** - *29.06.2025* - Базовая функциональность
```
✅ 4 рабочие ноды (automation, scraper, form, clicker)
✅ Исправлены критические ошибки браузера
✅ Работа на Raspberry Pi / ARM64
✅ Скриншоты и парсинг данных
⚠️ ПРОБЛЕМА: Нет поддержки сессий браузера
```

### **0.1.1** - *30.06.2025* - Система сессий ✅ **ГОТОВО**
```
🎯 ЦЕЛЬ: Решить проблему сессий браузера ✅
📋 ЗАДАЧИ: 3 новые ноды для управления сессиями ✅
🏗️ АРХИТЕКТУРА: Менеджер сессий в памяти ✅
🚀 СТАТУС: Все ноды созданы, протестированы, доступны в Node-RED
```

---

## 🎯 **КРИТЕРИИ УСПЕХА v0.1.1:**

1. ✅ **Создание сессии:** `session-start` создает браузер и возвращает ID
2. ✅ **Действия в сессии:** `session-action` использует существующий браузер  
3. ✅ **Последовательность:** Несколько действий в одном браузере
4. ✅ **Закрытие:** `session-end` корректно освобождает ресурсы
5. ✅ **Пример:** Полная цепочка автоматизации работает

## 🚨 **ВАЖНЫЕ НАПОМИНАНИЯ ДЛЯ CLAUDE:**
- Система версионирования: 0.1.X (по сотым)
- Основная проблема: СЕССИИ БРАУЗЕРА (каждая нода = новый браузер)
- Среда: Raspberry Pi + Node-RED + xvfb
- Цель: Автоматический серфинг в одной сессии браузера
- Текущие ноды работают, но изолированно

---

---

## 🎉 **СИСТЕМА СЕССИЙ v0.1.1 ГОТОВА!**

### ✅ **Что реализовано:**
- **🧩 SessionManager** - менеджер сессий в памяти Node-RED процесса
- **🟢 session-start** - создание и открытие сессии браузера
- **🔵 session-action** - 15 типов действий в существующей сессии
- **🔴 session-end** - закрытие сессии и освобождение ресурсов
- **📦 Полная интеграция** в Node-RED с HTML интерфейсами
- **🔄 Автоочистка** старых сессий (30 мин неактивности)
- **🛑 Graceful shutdown** при остановке Node-RED

### 🚀 **Теперь доступно:**
```
[inject] → [session-start] → [session-action] → [session-action] → [session-end]
   ↓           ↓                  ↓               ↓               ↓
 Старт     Открыть браузер    Ввести email    Кликнуть       Закрыть
          site.com           в форму         кнопку         браузер
          
session_id передается автоматически →→→→→→→→→→→→→→→→→→→→→→→
```

### 🎯 **Ваш автоматический серфинг теперь работает!**

---

## 🗓️ **Планы v0.1.2:**
- [ ] Обработка всплывающих окон и алертов
- [ ] Загрузка файлов через формы  
- [ ] Работа с iframe и множественными вкладками
- [ ] Дополнительные селекторы (XPath, текст)

---

*Обновлено: 30.06.2025 01:55 - Система сессий v0.1.1 успешно реализована! 🎉* 
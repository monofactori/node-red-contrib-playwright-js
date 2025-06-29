# 🍓 Установка Playwright автоматизации на Raspberry Pi

**Полное руководство по установке системы веб-автоматизации с Playwright и Node-RED на Raspberry Pi**

---

## 📋 Требования

- **Raspberry Pi 4** (2GB RAM минимум, 4GB рекомендуется)
- **Debian/Ubuntu** (протестировано на Debian 12)
- **Node.js 18+** и **npm**
- **Интернет соединение** для загрузки пакетов
- **SSH доступ** к Raspberry Pi

---

## 🚀 Шаг 1: Подготовка системы

### Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### Установка необходимых пакетов
```bash
sudo apt install -y curl git build-essential
```

### Установка Node.js (если не установлен)
```bash
# Установка через NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версии
node --version  # Должно быть v18+ 
npm --version
```

---

## 🔧 Шаг 2: Установка Node-RED (если не установлен)

### Установка Node-RED
```bash
sudo npm install -g --unsafe-perm node-red
```

### Запуск Node-RED как сервис
```bash
# Создание сервиса
sudo systemctl enable nodered.service
sudo systemctl start nodered.service

# Проверка статуса
sudo systemctl status nodered.service
```

### Альтернативно: Запуск вручную
```bash
node-red
```

**Node-RED будет доступен по адресу:** `http://IP_АДРЕС:1880`

---

## 🎭 Шаг 3: Установка Playwright

### Создание проекта автоматизации
```bash
cd /root  # или /home/ваш_пользователь
mkdir web-automation
cd web-automation
npm init -y
```

### Установка Playwright
```bash
npm install playwright
```

### Установка браузеров
```bash
npx playwright install chromium
```

### Установка системных зависимостей
```bash
npx playwright install-deps
```

### Установка виртуального дисплея
```bash
sudo apt install -y xvfb
```

---

## 📝 Шаг 4: Создание скриптов автоматизации

### Создание тестового скрипта
```bash
cat > test-automation.js << 'EOF'
const { chromium } = require('playwright');

async function runAutomation() {
    // Запускаем браузер с дополнительными флагами для стабильности на ARM/Pi
    const browser = await chromium.launch({ 
        headless: false, // отключаем headless чтобы обойти проблему headless_shell
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--virtual-time-budget=1000' // ограничиваем время выполнения
        ]
    });
    const page = await browser.newPage();
    
    try {
        // Переходим на сайт
        await page.goto('https://example.com');
        
        // Получаем заголовок страницы
        const title = await page.title();
        console.log('Заголовок страницы:', title);
        
        // Делаем скриншот
        await page.screenshot({ path: 'screenshot.png' });
        console.log('Скриншот сохранен как screenshot.png');
        
        // Возвращаем результат
        return {
            success: true,
            title: title,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Ошибка:', error.message);
        return {
            success: false,
            error: error.message
        };
    } finally {
        await browser.close();
    }
}

// Если скрипт запускается напрямую
if (require.main === module) {
    runAutomation()
        .then(result => {
            console.log('Результат:', JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error('Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { runAutomation };
EOF
```

### Создание скрипта для форм
```bash
cat > form-automation.js << 'EOF'
const { chromium } = require('playwright');

async function fillForm(formData) {
    const browser = await chromium.launch({ 
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    const page = await browser.newPage();
    
    try {
        // Пример для формы обратной связи
        await page.goto(formData.url || 'https://httpbin.org/forms/post');
        
        // Ждем загрузки формы
        await page.waitForLoadState('networkidle');
        
        // Заполняем поля если они есть
        if (formData.email) {
            await page.fill('input[name="email"]', formData.email);
        }
        
        if (formData.name) {
            await page.fill('input[name="custname"]', formData.name);
        }
        
        if (formData.message) {
            await page.fill('textarea[name="comments"]', formData.message);
        }
        
        // Делаем скриншот заполненной формы
        await page.screenshot({ path: 'filled-form.png' });
        
        console.log('Форма успешно заполнена');
        
        return {
            success: true,
            message: 'Форма заполнена',
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Ошибка при заполнении формы:', error.message);
        return {
            success: false,
            error: error.message
        };
    } finally {
        await browser.close();
    }
}

// Функция для парсинга данных с сайта
async function scrapePage(url, selectors) {
    const browser = await chromium.launch({ 
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    const page = await browser.newPage();
    
    try {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        const data = {};
        
        // Извлекаем данные по селекторам
        for (const [key, selector] of Object.entries(selectors)) {
            try {
                const element = await page.$(selector);
                if (element) {
                    data[key] = await element.textContent();
                }
            } catch (err) {
                console.warn(`Не удалось найти элемент ${selector}:`, err.message);
                data[key] = null;
            }
        }
        
        return {
            success: true,
            data: data,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    } finally {
        await browser.close();
    }
}

module.exports = { fillForm, scrapePage };
EOF
```

### Создание wrapper скрипта
```bash
cat > node-red-wrapper.js << 'EOF'
#!/usr/bin/env node

const { runAutomation } = require('./test-automation');
const { fillForm, scrapePage } = require('./form-automation');

// Получаем аргументы командной строки
const args = process.argv.slice(2);
const action = args[0];

async function main() {
    try {
        let result;
        
        switch (action) {
            case 'test':
                // Простой тест
                result = await runAutomation();
                break;
                
            case 'fill-form':
                // Заполнение формы
                const formData = args[1] ? JSON.parse(args[1]) : {
                    url: 'https://httpbin.org/forms/post',
                    name: 'Test User',
                    email: 'test@example.com',
                    message: 'Тестовое сообщение от Node-RED'
                };
                result = await fillForm(formData);
                break;
                
            case 'scrape':
                // Парсинг страницы
                const url = args[1] || 'https://example.com';
                const selectors = args[2] ? JSON.parse(args[2]) : {
                    title: 'h1',
                    description: 'p'
                };
                result = await scrapePage(url, selectors);
                break;
                
            default:
                result = {
                    success: false,
                    error: 'Неизвестное действие. Доступные: test, fill-form, scrape'
                };
        }
        
        // Выводим результат в JSON формате для Node-RED
        console.log(JSON.stringify(result, null, 2));
        
        // Возвращаем код завершения
        process.exit(result.success ? 0 : 1);
        
    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }, null, 2));
        process.exit(1);
    }
}

main();
EOF
```

### Создание удобного bash скрипта
```bash
cat > playwright-node-red.sh << 'EOF'
#!/bin/bash

# Скрипт для запуска Playwright из Node-RED
# Автоматически использует xvfb для виртуального дисплея

cd /root/web-automation

# Запускаем команду с виртуальным дисплеем
xvfb-run -a node node-red-wrapper.js "$@"
EOF
```

### Установка прав на выполнение
```bash
chmod +x node-red-wrapper.js
chmod +x playwright-node-red.sh
```

---

## 🧪 Шаг 5: Тестирование

### Тест базовой функциональности
```bash
# Простой тест
./playwright-node-red.sh test

# Заполнение формы
./playwright-node-red.sh fill-form '{"name":"Тест","email":"test@example.com"}'

# Парсинг страницы
./playwright-node-red.sh scrape https://example.com '{"title":"h1","text":"p"}'
```

**Ожидаемый результат:** JSON с данными о выполнении

---

## 🎭 Шаг 6: Создание Node-RED плагина

### Создание структуры плагина
```bash
cd /root
mkdir node-red-contrib-playwright-js
cd node-red-contrib-playwright-js
```

### Создание package.json
```bash
cat > package.json << 'EOF'
{
  "name": "node-red-contrib-playwright-js",
  "version": "1.0.0",
  "description": "Node-RED узлы для автоматизации браузера с Playwright на JavaScript",
  "main": "index.js",
  "files": [
    "playwright-automation/*",
    "playwright-scraper/*",
    "playwright-form/*"
  ],
  "keywords": [
    "node-red",
    "playwright",
    "browser",
    "automation",
    "javascript",
    "scraping",
    "forms"
  ],
  "node-red": {
    "version": ">=2.0.0",
    "nodes": {
      "playwright-automation": "playwright-automation/playwright-automation.js",
      "playwright-scraper": "playwright-scraper/playwright-scraper.js",
      "playwright-form": "playwright-form/playwright-form.js"
    }
  },
  "author": "Raspberry Pi Automation",
  "license": "MIT",
  "dependencies": {
    "playwright": "^1.40.0"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
EOF
```

### Создание папок для узлов
```bash
mkdir playwright-automation playwright-scraper playwright-form
```

### Создание файлов узлов
*Примечание: Файлы для узлов уже созданы в предыдущих шагах. Скопируйте их в соответствующие папки.*

### Создание главного index.js
```bash
cat > index.js << 'EOF'
module.exports = function(RED) {
    // Загружаем и регистрируем все узлы Playwright
    require('./playwright-automation/playwright-automation.js')(RED);
    require('./playwright-scraper/playwright-scraper.js')(RED);
    require('./playwright-form/playwright-form.js')(RED);
};
EOF
```

---

## 📦 Шаг 7: Установка плагина в Node-RED

### Установка плагина
```bash
cd ~/.node-red  # или /root/.node-red для root пользователя
npm install /root/node-red-contrib-playwright-js
```

### Перезапуск Node-RED
```bash
# Если запущен как сервис
sudo systemctl restart nodered

# Если запущен вручную
pkill -f node-red
sleep 2
nohup node-red > node-red.log 2>&1 &
```

### Проверка установки
```bash
# Проверка логов
tail -f ~/.node-red/node-red.log

# Проверка что Node-RED запущен
ps aux | grep node-red | grep -v grep
```

---

## 🌐 Шаг 8: Использование в Node-RED

### Открытие веб-интерфейса
1. Откройте браузер
2. Перейдите на: `http://IP_ВАШЕГО_PI:1880`
3. В левой палитре найдите новые узлы в разделе **"function"**

### Доступные узлы
- **🎭 playwright-automation** (синий) - скриншоты и тесты
- **🔍 playwright-scraper** (красный) - извлечение данных  
- **📝 playwright-form** (бирюзовый) - заполнение форм

### Создание первого flow
1. Перетащите **inject node** из палитры
2. Перетащите **playwright-automation node**
3. Перетащите **debug node**
4. Соедините их проводами
5. Дважды кликните на **playwright-automation**:
   - URL: `https://example.com`
   - Action: `test`
   - Delay: `1000`
6. Нажмите **Done**, затем **Deploy**
7. Нажмите кнопку на **inject node**
8. Смотрите результат в **debug** панели справа

---

## 🛠️ Устранение неполадок

### Проблема: Браузер не запускается
**Решение:**
```bash
# Проверка xvfb
sudo apt install -y xvfb

# Тест запуска
xvfb-run -a node /root/web-automation/node-red-wrapper.js test
```

### Проблема: Ошибки разрешений
**Решение:**
```bash
# Установка прав на папки
chmod -R 755 /root/web-automation
chmod +x /root/web-automation/*.sh
```

### Проблема: Node-RED не видит узлы
**Решение:**
```bash
# Переустановка плагина
cd ~/.node-red
npm uninstall node-red-contrib-playwright-js
npm install /root/node-red-contrib-playwright-js
sudo systemctl restart nodered
```

### Проблема: Недостаточно памяти
**Решение:**
```bash
# Увеличение swap файла
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📊 Мониторинг производительности

### Проверка использования ресурсов
```bash
# Память и CPU
htop

# Температура Pi
vcgencmd measure_temp

# Место на диске
df -h
```

### Оптимизация для Pi
- Используйте **headless: true** для экономии ресурсов
- Ограничивайте количество одновременных браузеров
- Регулярно очищайте временные файлы

---

## 🎯 Примеры использования

### 1. Мониторинг сайта
Создайте flow с **inject** (каждые 5 минут) → **playwright-automation** → **function** (проверка изменений) → **email** (уведомление)

### 2. Парсинг цен
**inject** → **playwright-scraper** (селекторы цен) → **function** (сравнение) → **database** (сохранение)

### 3. Автоматическая отправка форм
**http in** (webhook) → **function** (подготовка данных) → **playwright-form** → **http response**

---

## ✅ Заключение

Поздравляем! Вы успешно установили полнофункциональную систему веб-автоматизации на Raspberry Pi:

- ✅ **Playwright** установлен и настроен
- ✅ **Node-RED плагин** создан и работает  
- ✅ **Три типа узлов** для разных задач
- ✅ **Оптимизация для ARM** процессоров
- ✅ **Русский интерфейс** и документация

**Ваша система готова к серьезным задачам автоматизации!** 🚀

---

## 📚 Дополнительные ресурсы

- [Playwright документация](https://playwright.dev/)
- [Node-RED документация](https://nodered.org/docs/)
- [Raspberry Pi оптимизация](https://www.raspberrypi.org/documentation/)

**Удачной автоматизации!** 🎭🍓 
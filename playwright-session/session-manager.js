const { chromium } = require('playwright');

// CapMonster Cloud клиент подгружается только при необходимости
let CapMonsterCloudClientFactory, ClientOptions, RecaptchaV2Request, HcaptchaRequest, ImageToTextRequest, TurnstileRequest;

// Функция для ленивой загрузки CapMonster клиента
function loadCapMonsterClient() {
    if (!CapMonsterCloudClientFactory) {
        try {
            const capmonster = require('@zennolab_com/capmonstercloud-client');
            CapMonsterCloudClientFactory = capmonster.CapMonsterCloudClientFactory;
            ClientOptions = capmonster.ClientOptions;
            RecaptchaV2Request = capmonster.RecaptchaV2Request;
            HcaptchaRequest = capmonster.HcaptchaRequest;
            ImageToTextRequest = capmonster.ImageToTextRequest;
            TurnstileRequest = capmonster.TurnstileRequest;
            console.log('🤖 CapMonster Cloud клиент загружен успешно');
        } catch (error) {
            throw new Error('CapMonster Cloud клиент не установлен. Выполните: npm install @zennolab_com/capmonstercloud-client');
        }
    }
}

/**
 * 🧩 Менеджер сессий браузера для Node-RED Playwright
 * Управляет браузерными сессиями в памяти процесса Node-RED
 */
class SessionManager {
    constructor() {
        this.sessions = new Map(); // session_id → { browser, page, context, created_at }
        this.cleanup_interval = null;
        this.startCleanupTimer();
    }

    /**
     * 🟢 Создать новую сессию браузера
     * @param {string} url - Начальный URL
     * @param {object} options - Опции браузера
     * @returns {Promise<string>} session_id
     */
    async createSession(url, options = {}) {
        try {
            // Настройки браузера для Raspberry Pi / ARM
            const browserOptions = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox', 
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-features=VizDisplayCompositor',
                    '--no-first-run',
                    '--disable-default-apps'
                ],
                ...options
            };

            console.log('🟢 Создание новой сессии браузера...');
            const browser = await chromium.launch(browserOptions);
            
            // 🛡️ Создаем контекст с реалистичным User-Agent (без HeadlessChrome!)
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            const page = await context.newPage();
            
            // НЕ открываем URL сразу! Это нужно делать ПОСЛЕ применения стелс-режима
            // URL будет использован позже через действие "navigate"
            console.log('🛡️ Браузер создан. Используйте стелс-режим ДО навигации на целевой сайт!');

            // Генерируем уникальный ID сессии
            const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Сохраняем сессию
            this.sessions.set(sessionId, {
                browser,
                page,
                context,
                created_at: new Date(),
                last_activity: new Date(),
                initial_url: url
            });

            console.log(`✅ Сессия создана: ${sessionId}`);
            return sessionId;

        } catch (error) {
            console.error('❌ Ошибка создания сессии:', error.message);
            throw new Error(`Не удалось создать сессию браузера: ${error.message}`);
        }
    }

    /**
     * 🔵 Получить сессию по ID
     * @param {string} sessionId 
     * @returns {object|null} { browser, page, context }
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            // Обновляем время последней активности
            session.last_activity = new Date();
            return session;
        }
        return null;
    }

    /**
     * 🔵 Выполнить действие в сессии
     * @param {string} sessionId - ID сессии
     * @param {string} action - Тип действия
     * @param {object} params - Параметры действия
     * @returns {Promise<object>} Результат действия
     */
    async executeAction(sessionId, action, params = {}) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`Сессия ${sessionId} не найдена или закрыта`);
        }

        const { page } = session;
        
        try {
            console.log(`🔵 Действие: ${action} в сессии ${sessionId}`);
            let result = { success: true, action, session_id: sessionId };

            switch (action) {
                // 📝 Ввод данных
                case 'fill_form':
                    if (!params.selector || params.value === undefined) {
                        throw new Error('Требуются параметры: selector, value');
                    }
                    await page.fill(params.selector, String(params.value));
                    result.message = `Заполнено поле ${params.selector}`;
                    break;

                case 'fill_multiple':
                    if (!params.fields || !Array.isArray(params.fields)) {
                        throw new Error('Требуется параметр fields (массив объектов {selector, value})');
                    }
                    for (const field of params.fields) {
                        await page.fill(field.selector, String(field.value));
                    }
                    result.message = `Заполнено ${params.fields.length} полей`;
                    break;

                case 'select_option':
                    if (!params.selector || !params.value) {
                        throw new Error('Требуются параметры: selector, value');
                    }
                    await page.selectOption(params.selector, params.value);
                    result.message = `Выбрана опция ${params.value}`;
                    break;

                // 🖱️ Клики и навигация
                case 'click':
                    if (!params.selector) {
                        throw new Error('Требуется параметр: selector');
                    }
                    await page.click(params.selector);
                    result.message = `Клик по ${params.selector}`;
                    if (params.wait_after) {
                        await page.waitForTimeout(params.wait_after);
                    }
                    break;

                case 'navigate':
                    if (!params.url) {
                        throw new Error('Требуется параметр: url');
                    }
                    
                    // 🚀 Настраиваемые параметры навигации
                    const navOptions = {
                        waitUntil: params.waitUntil || 'domcontentloaded', // 'load', 'domcontentloaded', 'networkidle'
                        timeout: params.timeout || 30000 // по умолчанию 30 сек вместо 60
                    };
                    
                    console.log(`🌐 Переход на ${params.url}, ожидание: ${navOptions.waitUntil}, таймаут: ${navOptions.timeout}мс`);
                    await page.goto(params.url, navOptions);
                    result.new_url = params.url;
                    result.message = `Переход на ${params.url} (${navOptions.waitUntil})`;
                    break;

                case 'go_back':
                    await page.goBack();
                    result.message = 'Переход назад';
                    break;

                case 'go_forward':
                    await page.goForward();
                    result.message = 'Переход вперед';
                    break;

                case 'reload':
                    await page.reload();
                    result.message = 'Страница перезагружена';
                    break;

                // ⏳ Ожидание
                case 'wait_for_element':
                    if (!params.selector) {
                        throw new Error('Требуется параметр: selector');
                    }
                    await page.waitForSelector(params.selector, { 
                        timeout: params.timeout || 30000 
                    });
                    result.message = `Элемент ${params.selector} найден`;
                    break;

                case 'wait_for_text':
                    if (!params.text) {
                        throw new Error('Требуется параметр: text');
                    }
                    await page.waitForFunction(
                        text => document.body.innerText.includes(text),
                        params.text,
                        { timeout: params.timeout || 30000 }
                    );
                    result.message = `Текст "${params.text}" найден`;
                    break;

                case 'wait_timeout':
                    const timeout = params.timeout || 1000;
                    await page.waitForTimeout(timeout);
                    result.message = `Ожидание ${timeout}мс`;
                    break;

                // 📊 Получение данных
                case 'screenshot':
                    const screenshot = await page.screenshot({ 
                        type: 'png',
                        encoding: 'base64',
                        fullPage: params.full_page || false
                    });
                    result.screenshot = screenshot;
                    result.message = 'Скриншот сделан';
                    break;

                case 'get_text':
                    if (!params.selector) {
                        throw new Error('Требуется параметр: selector');
                    }
                    const element = await page.$(params.selector);
                    if (element) {
                        result.text = await element.textContent();
                        result.message = `Текст получен из ${params.selector}`;
                    } else {
                        throw new Error(`Элемент ${params.selector} не найден`);
                    }
                    break;

                case 'get_url':
                    result.current_url = page.url();
                    result.message = 'Текущий URL получен';
                    break;

                case 'scrape':
                    if (!params.selectors) {
                        throw new Error('Требуется параметр: selectors (объект)');
                    }
                    const data = {};
                    for (const [key, selector] of Object.entries(params.selectors)) {
                        try {
                            const element = await page.$(selector);
                            data[key] = element ? await element.textContent() : null;
                        } catch (e) {
                            data[key] = null;
                        }
                    }
                    result.scraped_data = data;
                    result.message = `Извлечено ${Object.keys(data).length} элементов`;
                    break;

                // 💻 JavaScript
                case 'execute_js':
                    if (!params.code) {
                        throw new Error('Требуется параметр: code');
                    }
                    result.js_result = await page.evaluate(params.code);
                    result.message = 'JavaScript выполнен';
                    break;

                case 'scroll':
                    const x = params.x || 0;
                    const y = params.y || 500;
                    await page.evaluate((x, y) => window.scrollBy(x, y), x, y);
                    result.message = `Прокрутка на ${x}, ${y}`;
                    break;

                // 🍪 Cookies и Storage
                case 'set_cookies':
                    if (!params.cookies || !Array.isArray(params.cookies)) {
                        throw new Error('Требуется параметр cookies (массив)');
                    }
                    await page.context().addCookies(params.cookies);
                    result.message = `Установлено ${params.cookies.length} cookies`;
                    break;

                case 'get_cookies':
                    result.cookies = await page.context().cookies();
                    result.message = `Получено ${result.cookies.length} cookies`;
                    break;

                case 'clear_cookies':
                    await page.context().clearCookies();
                    result.message = 'Cookies очищены';
                    break;

                case 'set_local_storage':
                    if (!params.key || params.value === undefined) {
                        throw new Error('Требуются параметры: key, value');
                    }
                    await page.evaluate(({key, value}) => localStorage.setItem(key, value), params);
                    result.message = `LocalStorage: ${params.key} установлен`;
                    break;

                // 🌐 Headers и User-Agent
                case 'set_user_agent':
                    if (!params.user_agent) {
                        throw new Error('Требуется параметр user_agent');
                    }
                    await page.setUserAgent(params.user_agent);
                    result.message = `User-Agent установлен: ${params.user_agent}`;
                    break;

                case 'set_extra_headers':
                    if (!params.headers || typeof params.headers !== 'object') {
                        throw new Error('Требуется параметр headers (объект)');
                    }
                    await page.setExtraHTTPHeaders(params.headers);
                    result.message = `Установлены заголовки: ${Object.keys(params.headers).join(', ')}`;
                    break;

                // 📱 Эмуляция устройств
                case 'emulate_device':
                    if (!params.device_name) {
                        throw new Error('Требуется параметр device_name');
                    }
                    const devices = require('playwright').devices;
                    if (devices[params.device_name]) {
                        await page.emulate(devices[params.device_name]);
                        result.message = `Эмулируется устройство: ${params.device_name}`;
                    } else {
                        throw new Error(`Устройство ${params.device_name} не найдено`);
                    }
                    break;

                case 'set_viewport':
                    const width = params.width || 1920;
                    const height = params.height || 1080;
                    await page.setViewportSize({ width, height });
                    result.message = `Размер экрана: ${width}x${height}`;
                    break;

                // 📂 Файлы
                case 'upload_file':
                    if (!params.selector || !params.file_path) {
                        throw new Error('Требуются параметры: selector, file_path');
                    }
                    await page.setInputFiles(params.selector, params.file_path);
                    result.message = `Файл загружен: ${params.file_path}`;
                    break;

                case 'download_file':
                    if (!params.download_trigger) {
                        throw new Error('Требуется параметр download_trigger (selector или function)');
                    }
                    const downloadPromise = page.waitForEvent('download');
                    if (typeof params.download_trigger === 'string') {
                        await page.click(params.download_trigger);
                    } else {
                        await page.evaluate(params.download_trigger);
                    }
                    const download = await downloadPromise;
                    const download_path = params.save_path || `./downloads/${download.suggestedFilename()}`;
                    await download.saveAs(download_path);
                    result.download_path = download_path;
                    result.message = `Файл скачан: ${download_path}`;
                    break;

                // 🗨️ Диалоги
                case 'handle_dialog':
                    if (!params.action) {
                        throw new Error('Требуется параметр action (accept/dismiss)');
                    }
                    page.once('dialog', async dialog => {
                        if (params.action === 'accept') {
                            await dialog.accept(params.prompt_text || '');
                        } else {
                            await dialog.dismiss();
                        }
                    });
                    result.message = `Обработка диалогов настроена: ${params.action}`;
                    break;

                // 🔄 Продвинутая навигация
                case 'wait_for_navigation':
                    const navigationPromise = page.waitForNavigation({
                        waitUntil: params.wait_until || 'networkidle',
                        timeout: params.timeout || 30000
                    });
                    if (params.trigger_selector) {
                        await page.click(params.trigger_selector);
                    }
                    await navigationPromise;
                    result.new_url = page.url();
                    result.message = 'Навигация завершена';
                    break;

                case 'hover':
                    if (!params.selector) {
                        throw new Error('Требуется параметр: selector');
                    }
                    await page.hover(params.selector);
                    result.message = `Наведение на ${params.selector}`;
                    break;

                case 'focus':
                    if (!params.selector) {
                        throw new Error('Требуется параметр: selector');
                    }
                    await page.focus(params.selector);
                    result.message = `Фокус на ${params.selector}`;
                    break;

                case 'press_key':
                    if (!params.key) {
                        throw new Error('Требуется параметр: key');
                    }
                    if (params.selector) {
                        await page.press(params.selector, params.key);
                    } else {
                        await page.keyboard.press(params.key);
                    }
                    result.message = `Нажата клавиша: ${params.key}`;
                    break;

                case 'type_text':
                    if (!params.text) {
                        throw new Error('Требуется параметр: text');
                    }
                    if (params.selector) {
                        await page.type(params.selector, params.text, { delay: params.delay || 100 });
                    } else {
                        await page.keyboard.type(params.text, { delay: params.delay || 100 });
                    }
                    result.message = `Введен текст: ${params.text}`;
                    break;

                // 🛡️ Антидетект и обход
                case 'accept_cookie_banner':
                    // Пытаемся найти и нажать кнопки принятия cookies
                    const cookieSelectors = [
                        // Специфичные селекторы для популярных сайтов
                        '#onetrust-accept-btn-handler', // OneTrust (LTX Studio, многие сайты)
                        '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', // Cookiebot
                        'button[id*="accept"]', 'button[class*="accept"]',
                        'button[id*="cookie"]', 'button[class*="cookie"]',
                        'button:has-text("Accept")', 'button:has-text("Allow All")',
                        'button:has-text("Принять")', 'button:has-text("OK")', 
                        'button:has-text("Согласен")', 'button:has-text("I Accept")',
                        '[data-testid*="accept"]', '[data-cy*="accept"]',
                        '.cookie-accept', '.accept-cookies',
                        '[aria-label*="Accept"]', '[aria-label*="Allow"]'
                    ];
                    
                    let clicked = false;
                    let attempts = [];
                    
                    // Сначала ждем появления любого cookie banner
                    try {
                        await page.waitForSelector('#onetrust-banner-sdk, .cookie-banner, [class*="cookie"], [id*="cookie"]', { 
                            timeout: 5000 
                        });
                        await page.waitForTimeout(1000); // Даем время на анимацию
                    } catch (e) {
                        // Продолжаем даже если не нашли banner
                    }
                    
                    // Пробуем кликнуть по кнопкам
                    for (const selector of cookieSelectors) {
                        try {
                            // Проверяем что элемент существует и видим
                            const element = await page.$(selector);
                            if (element) {
                                const isVisible = await element.isVisible();
                                if (isVisible) {
                                    await page.click(selector, { timeout: 3000 });
                                    clicked = true;
                                    attempts.push({ selector, success: true, method: 'click' });
                                    break;
                                } else {
                                    // Пробуем принудительно показать и кликнуть
                                    await page.evaluate((sel) => {
                                        const el = document.querySelector(sel);
                                        if (el) {
                                            el.style.display = 'block';
                                            el.style.visibility = 'visible';
                                            el.style.opacity = '1';
                                            el.click();
                                        }
                                    }, selector);
                                    clicked = true;
                                    attempts.push({ selector, success: true, method: 'force_click' });
                                    break;
                                }
                            }
                        } catch (e) {
                            attempts.push({ selector, success: false, error: e.message });
                        }
                    }
                    
                    result.clicked = clicked;
                    result.attempts = attempts;
                    result.message = clicked ? 'Cookie banner принят' : 'Cookie banner не найден';
                    break;

                case 'stealth_mode':
                    // 🛡️ ПРОДВИНУТЫЙ СТЕЛС-РЕЖИМ для обхода bot.sannysoft.com
                    await page.addInitScript(() => {
                        // 1. УМНОЕ скрытие WebDriver properties (без Proxy)
                        
                        // Безопасное удаление webdriver
                        try {
                            Object.defineProperty(navigator, 'webdriver', {
                                get: () => undefined,
                                enumerable: false,
                                configurable: true
                            });
                        } catch(e) {}
                        
                        // Очищаем webdriver из разных мест
                        try {
                            delete Navigator.prototype.webdriver;
                            delete navigator.__proto__.webdriver;
                            delete navigator.webdriver;
                        } catch(e) {}
                        
                        // Проверяем что webdriver действительно undefined
                        if (navigator.webdriver !== undefined) {
                            try {
                                navigator.webdriver = undefined;
                            } catch(e) {}
                        }
                        
                        // 2. Chrome properties - исправляем "Chrome (New) missing"
                        Object.defineProperty(window, 'chrome', {
                            value: {
                                runtime: {
                                    onConnect: undefined,
                                    onMessage: undefined,
                                },
                                loadTimes: function() { return {}; },
                                csi: function() { return {}; },
                            },
                            configurable: true,
                            enumerable: true,
                            writable: true
                        });

                        // 3. Permissions API
                        const originalQuery = window.navigator.permissions.query;
                        window.navigator.permissions.query = (parameters) => (
                            parameters.name === 'notifications' ?
                                Promise.resolve({ state: Notification.permission }) :
                                originalQuery(parameters)
                        );

                        // 4. ПРАВИЛЬНАЯ эмуляция PluginArray с наследованием
                        
                        try {
                            // Получаем оригинальные плагины
                            const originalPlugins = navigator.plugins;
                            
                            // Создаем новый PluginArray вручную
                            const fakePluginArray = [];
                            
                            // Добавляем плагины
                            const pluginData = [
                                {
                                    description: "Portable Document Format",
                                    filename: "internal-pdf-viewer",
                                    length: 1,
                                    name: "Chrome PDF Plugin"
                                },
                                {
                                    description: "Portable Document Format", 
                                    filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
                                    length: 1,
                                    name: "Chrome PDF Viewer"
                                },
                                {
                                    description: "Native Client",
                                    filename: "internal-nacl-plugin", 
                                    length: 2,
                                    name: "Native Client"
                                }
                            ];
                            
                            // Копируем плагины в массив
                            for (let i = 0; i < pluginData.length; i++) {
                                fakePluginArray[i] = pluginData[i];
                            }
                            fakePluginArray.length = pluginData.length;
                            
                            // Устанавливаем правильный прототип
                            Object.setPrototypeOf(fakePluginArray, PluginArray.prototype);
                            
                            // Добавляем методы PluginArray
                            fakePluginArray.refresh = function() {};
                            fakePluginArray.namedItem = function(name) {
                                for (let i = 0; i < this.length; i++) {
                                    if (this[i] && this[i].name === name) {
                                        return this[i];
                                    }
                                }
                                return null;
                            };
                            
                            // Делаем его неизменяемым как настоящий PluginArray
                            Object.defineProperty(fakePluginArray, 'length', {
                                value: pluginData.length,
                                writable: false,
                                enumerable: false,
                                configurable: false
                            });
                            
                            // Заменяем navigator.plugins
                            Object.defineProperty(navigator, 'plugins', {
                                get: () => fakePluginArray,
                                enumerable: true,
                                configurable: true
                            });
                            
                        } catch(e) {
                            console.warn('Не удалось переопределить plugins:', e);
                        }

                        // 5. Languages - более реалистичные
                        Object.defineProperty(navigator, 'languages', {
                            get: () => ['en-US', 'en'],
                        });

                        // 6. WebGL - предотвращаем детекцию по контексту
                        const getParameter = WebGLRenderingContext.prototype.getParameter;
                        WebGLRenderingContext.prototype.getParameter = function(parameter) {
                            if (parameter === 37445) {
                                return 'Intel Inc.'; // UNMASKED_VENDOR_WEBGL
                            }
                            if (parameter === 37446) {
                                return 'Intel Iris OpenGL Engine'; // UNMASKED_RENDERER_WEBGL  
                            }
                            return getParameter.call(this, parameter);
                        };

                        // 7. Canvas fingerprinting защита
                        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
                        HTMLCanvasElement.prototype.toDataURL = function(...args) {
                            // Добавляем минимальный шум к canvas
                            const context = this.getContext('2d');
                            if (context) {
                                const originalData = context.getImageData(0, 0, this.width, this.height);
                                // Добавляем микро-шум
                                for (let i = 0; i < originalData.data.length; i += 4) {
                                    originalData.data[i] += Math.floor(Math.random() * 2); // R
                                    originalData.data[i + 1] += Math.floor(Math.random() * 2); // G  
                                    originalData.data[i + 2] += Math.floor(Math.random() * 2); // B
                                }
                                context.putImageData(originalData, 0, 0);
                            }
                            return originalToDataURL.apply(this, args);
                        };

                        // 8. Screen properties - реалистичные значения
                        Object.defineProperty(screen, 'colorDepth', {
                            value: 24
                        });
                        
                        Object.defineProperty(screen, 'pixelDepth', {
                            value: 24
                        });

                        // 9. Navigator properties
                        Object.defineProperty(navigator, 'hardwareConcurrency', {
                            value: 4
                        });

                        Object.defineProperty(navigator, 'deviceMemory', {
                            value: 8
                        });

                        Object.defineProperty(navigator, 'doNotTrack', {
                            value: null
                        });

                        // 10. ИСПРАВЛЕННЫЙ User Agent - убираем HeadlessChrome!
                        if (navigator.userAgent.includes('HeadlessChrome') || !navigator.userAgent.includes('Chrome')) {
                            Object.defineProperty(navigator, 'userAgent', {
                                value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                writable: false,
                                enumerable: true,
                                configurable: false
                            });
                        }

                        // 11. Notification API
                        if (typeof Notification !== 'undefined') {
                            Object.defineProperty(Notification, 'permission', {
                                value: 'default'
                            });
                        }

                        // 12. Battery API - удаляем если есть (может выдавать бота)
                        if ('getBattery' in navigator) {
                            delete navigator.getBattery;
                        }

                        // 13. Connection API - стандартизируем
                        if ('connection' in navigator) {
                            Object.defineProperty(navigator.connection, 'rtt', {
                                value: 100
                            });
                        }

                        // 14. Media devices
                        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                            const originalEnumerate = navigator.mediaDevices.enumerateDevices;
                            navigator.mediaDevices.enumerateDevices = function() {
                                return originalEnumerate().then(devices => {
                                    return devices.map(device => ({
                                        ...device,
                                        label: device.label || 'Default Device'
                                    }));
                                });
                            };
                        }

                        // 15. Переопределяем toString для некоторых функций
                        const nativeToStringFunctionString = Error.toString().replace(/Error/g, "toString");
                        const nativeToString = Function.prototype.toString;
                        
                        Function.prototype.toString = function() {
                            if (this === navigator.permissions.query) {
                                return 'function query() { [native code] }';
                            }
                            return nativeToString.call(this);
                        };

                        console.log('🛡️ Продвинутый стелс-режим активирован');
                    });

                    // Дополнительные настройки на уровне browser context
                    const { context } = session;
                    
                    // Блокируем WebRTC для предотвращения утечки IP
                    await context.addInitScript(() => {
                        Object.defineProperty(navigator, 'getUserMedia', {
                            value: undefined
                        });
                        
                        if (window.RTCPeerConnection) {
                            window.RTCPeerConnection = undefined;
                        }
                        
                        if (window.webkitRTCPeerConnection) {
                            window.webkitRTCPeerConnection = undefined;
                        }
                    });

                    result.message = 'Продвинутый стелс-режим активирован - обход bot.sannysoft.com';
                    result.stealth_features = [
                        'WebDriver properties скрыты',
                        'Chrome object создан',
                        'Plugins эмулированы',
                        'Canvas fingerprinting защищен',
                        'WebGL fingerprinting изменен',
                        'Screen properties настроены',
                        'WebRTC заблокирован',
                        'Navigator properties стандартизированы'
                    ];
                    break;

                case 'test_bot_detection':
                    // 🔍 Тестирование детекции бота на bot.sannysoft.com
                    const botTestUrl = params.test_url || 'https://bot.sannysoft.com/';
                    
                    await page.goto(botTestUrl, { 
                        waitUntil: 'networkidle', 
                        timeout: 60000 
                    });
                    
                    // Ждем загрузки тестов
                    await page.waitForTimeout(5000);
                    
                    // Извлекаем результаты тестов (безопасная версия)
                    const testResults = await page.evaluate(() => {
                        const results = {};
                        
                        // Ищем таблицу с результатами тестов
                        const table = document.querySelector('table');
                        if (table) {
                            const rows = table.querySelectorAll('tr');
                            rows.forEach(row => {
                                const cells = row.querySelectorAll('td');
                                if (cells.length >= 2) {
                                    const testName = cells[0].textContent.trim();
                                    const testResult = cells[1].textContent.trim();
                                    if (testName && testResult) {
                                        results[testName] = testResult;
                                    }
                                }
                            });
                        }
                        
                        // Дополнительная информация о браузере (безопасный доступ)
                        const browserInfo = {};
                        
                        try {
                            browserInfo.userAgent = navigator.userAgent || 'unknown';
                        } catch(e) { browserInfo.userAgent = 'error'; }
                        
                        try {
                            browserInfo.webdriver = navigator.webdriver;
                        } catch(e) { browserInfo.webdriver = 'error'; }
                        
                        try {
                            browserInfo.chrome = !!window.chrome;
                        } catch(e) { browserInfo.chrome = false; }
                        
                        try {
                            browserInfo.plugins = navigator.plugins ? navigator.plugins.length : 0;
                        } catch(e) { browserInfo.plugins = 0; }
                        
                        try {
                            browserInfo.languages = navigator.languages || [];
                        } catch(e) { browserInfo.languages = []; }
                        
                        try {
                            browserInfo.hardwareConcurrency = navigator.hardwareConcurrency || 4;
                        } catch(e) { browserInfo.hardwareConcurrency = 4; }
                        
                        try {
                            browserInfo.deviceMemory = navigator.deviceMemory || 8;
                        } catch(e) { browserInfo.deviceMemory = 8; }
                        
                        try {
                            browserInfo.doNotTrack = navigator.doNotTrack;
                        } catch(e) { browserInfo.doNotTrack = null; }
                        
                        return {
                            tests: results,
                            browser_info: browserInfo,
                            timestamp: new Date().toISOString()
                        };
                    });
                    
                    result.test_results = testResults;
                    result.test_url = botTestUrl;
                    result.message = 'Тестирование детекции бота завершено';
                    break;

                case 'stealth_user_agent':
                    // 🔄 Смена User-Agent на реалистичный
                    const userAgents = [
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
                    ];
                    
                    const selectedUA = params.user_agent || userAgents[Math.floor(Math.random() * userAgents.length)];
                    
                    await page.setUserAgent(selectedUA);
                    result.user_agent = selectedUA;
                    result.message = 'User-Agent изменен';
                    break;

                case 'stealth_viewport':
                    // 📱 Реалистичная настройка viewport
                    const viewports = [
                        { width: 1920, height: 1080 }, // Full HD
                        { width: 1366, height: 768 },  // Популярное разрешение ноутбука
                        { width: 1536, height: 864 },  // HD+
                        { width: 1440, height: 900 },  // MacBook
                        { width: 1280, height: 720 }   // HD
                    ];
                    
                    const viewport = params.viewport || viewports[Math.floor(Math.random() * viewports.length)];
                    
                    await page.setViewportSize(viewport);
                    result.viewport = viewport;
                    result.message = `Viewport установлен: ${viewport.width}x${viewport.height}`;
                    break;

                case 'stealth_geolocation':
                    // 🌍 Установка реалистичной геолокации
                    const locations = {
                        'new_york': { latitude: 40.7128, longitude: -74.0060, accuracy: 100 },
                        'london': { latitude: 51.5074, longitude: -0.1278, accuracy: 100 },
                        'tokyo': { latitude: 35.6762, longitude: 139.6503, accuracy: 100 },
                        'moscow': { latitude: 55.7558, longitude: 37.6176, accuracy: 100 },
                        'sydney': { latitude: -33.8688, longitude: 151.2093, accuracy: 100 }
                    };
                    
                    const locationName = params.location || 'new_york';
                    const location = locations[locationName] || locations.new_york;
                    
                    await page.setGeolocation(location);
                    result.geolocation = { location: locationName, ...location };
                    result.message = `Геолокация установлена: ${locationName}`;
                    break;

                case 'stealth_timezone':
                    // 🕐 Установка временной зоны
                    const timezones = [
                        'America/New_York',
                        'Europe/London', 
                        'Asia/Tokyo',
                        'Europe/Moscow',
                        'Australia/Sydney',
                        'America/Los_Angeles',
                        'Europe/Berlin'
                    ];
                    
                    const timezone = params.timezone || timezones[Math.floor(Math.random() * timezones.length)];
                    
                    await page.emulateTimezone(timezone);
                    result.timezone = timezone;
                    result.message = `Временная зона установлена: ${timezone}`;
                    break;

                // 🤖 CAPTCHA РЕШЕНИЕ с CapMonster Cloud
                case 'captcha_solve':
                    // Универсальный метод для решения разных типов капчи
                    loadCapMonsterClient(); // Загружаем клиент при необходимости
                    if (!params.api_key) {
                        throw new Error('Требуется api_key от CapMonster Cloud');
                    }
                    
                    const cmcClient = CapMonsterCloudClientFactory.Create(new ClientOptions({ 
                        clientKey: params.api_key 
                    }));
                    
                    let captchaRequest;
                    const captchaType = params.type || 'recaptcha_v2';
                    
                    switch (captchaType) {
                        case 'recaptcha_v2':
                            if (!params.website_url || !params.website_key) {
                                throw new Error('Для ReCaptcha v2 требуются: website_url, website_key');
                            }
                            captchaRequest = new RecaptchaV2Request({
                                websiteURL: params.website_url,
                                websiteKey: params.website_key,
                                userAgent: params.user_agent || await page.evaluate(() => navigator.userAgent),
                                proxy: params.proxy
                            });
                            break;
                            
                        case 'hcaptcha':
                            if (!params.website_url || !params.website_key) {
                                throw new Error('Для hCaptcha требуются: website_url, website_key');
                            }
                            captchaRequest = new HcaptchaRequest({
                                websiteURL: params.website_url,
                                websiteKey: params.website_key,
                                userAgent: params.user_agent || await page.evaluate(() => navigator.userAgent),
                                proxy: params.proxy
                            });
                            break;
                            
                        case 'image':
                            if (!params.image_base64) {
                                throw new Error('Для текстовой капчи требуется image_base64');
                            }
                            captchaRequest = new ImageToTextRequest({
                                body: params.image_base64
                            });
                            break;
                            
                        case 'turnstile':
                            if (!params.website_url || !params.website_key) {
                                throw new Error('Для Turnstile требуются: website_url, website_key');
                            }
                            captchaRequest = new TurnstileRequest({
                                websiteURL: params.website_url,
                                websiteKey: params.website_key,
                                action: params.turnstile_action,
                                cData: params.cdata,
                                chlPageData: params.chl_page_data,
                                userAgent: params.user_agent || await page.evaluate(() => navigator.userAgent),
                                proxy: params.proxy
                            });
                            break;
                            
                        default:
                            throw new Error(`Неподдерживаемый тип капчи: ${captchaType}`);
                    }
                    
                    console.log(`🤖 Решение капчи типа: ${captchaType}`);
                    const captchaResult = await cmcClient.Solve(captchaRequest);
                    
                    result.captcha_solution = captchaResult;
                    result.captcha_type = captchaType;
                    result.message = `Капча ${captchaType} решена успешно`;
                    break;

                case 'captcha_recaptcha_v2':
                    // 🔐 Специализированный метод для ReCaptcha v2
                    loadCapMonsterClient(); // Загружаем клиент при необходимости
                    if (!params.api_key) {
                        throw new Error('Требуется api_key от CapMonster Cloud');
                    }
                    if (!params.website_url || !params.website_key) {
                        throw new Error('Требуются параметры: website_url, website_key');
                    }
                    
                    const recaptchaClient = CapMonsterCloudClientFactory.Create(new ClientOptions({ 
                        clientKey: params.api_key 
                    }));
                    
                    const recaptchaRequest = new RecaptchaV2Request({
                        websiteURL: params.website_url,
                        websiteKey: params.website_key,
                        userAgent: params.user_agent || await page.evaluate(() => navigator.userAgent),
                        proxy: params.proxy
                    });
                    
                    console.log(`🔐 Решение ReCaptcha v2 для ${params.website_url}`);
                    const recaptchaResult = await recaptchaClient.Solve(recaptchaRequest);
                    
                    // Автоматически вставляем решение в форму, если указан селектор
                    if (params.response_selector) {
                        await page.evaluate((selector, response) => {
                            const element = document.querySelector(selector);
                            if (element) {
                                element.value = response;
                                // Триггерим события для обновления
                                element.dispatchEvent(new Event('input', { bubbles: true }));
                                element.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }, params.response_selector, recaptchaResult.solution.gRecaptchaResponse);
                        
                        result.message = 'ReCaptcha v2 решена и вставлена в форму';
                    } else {
                        result.message = 'ReCaptcha v2 решена';
                    }
                    
                    result.captcha_solution = recaptchaResult;
                    result.g_recaptcha_response = recaptchaResult.solution.gRecaptchaResponse;
                    break;

                case 'captcha_hcaptcha':
                    // 🛡️ Специализированный метод для hCaptcha
                    loadCapMonsterClient(); // Загружаем клиент при необходимости
                    if (!params.api_key) {
                        throw new Error('Требуется api_key от CapMonster Cloud');
                    }
                    if (!params.website_url || !params.website_key) {
                        throw new Error('Требуются параметры: website_url, website_key');
                    }
                    
                    const hcaptchaClient = CapMonsterCloudClientFactory.Create(new ClientOptions({ 
                        clientKey: params.api_key 
                    }));
                    
                    const hcaptchaRequest = new HcaptchaRequest({
                        websiteURL: params.website_url,
                        websiteKey: params.website_key,
                        userAgent: params.user_agent || await page.evaluate(() => navigator.userAgent),
                        proxy: params.proxy
                    });
                    
                    console.log(`🛡️ Решение hCaptcha для ${params.website_url}`);
                    const hcaptchaResult = await hcaptchaClient.Solve(hcaptchaRequest);
                    
                    // Автоматически вставляем решение в форму, если указан селектор
                    if (params.response_selector) {
                        await page.evaluate((selector, response) => {
                            const element = document.querySelector(selector);
                            if (element) {
                                element.value = response;
                                element.dispatchEvent(new Event('input', { bubbles: true }));
                                element.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }, params.response_selector, hcaptchaResult.solution.gRecaptchaResponse);
                        
                        result.message = 'hCaptcha решена и вставлена в форму';
                    } else {
                        result.message = 'hCaptcha решена';
                    }
                    
                    result.captcha_solution = hcaptchaResult;
                    result.h_captcha_response = hcaptchaResult.solution.gRecaptchaResponse;
                    break;

                case 'captcha_image':
                    // 📷 Решение текстовой капчи по изображению
                    loadCapMonsterClient(); // Загружаем клиент при необходимости
                    if (!params.api_key) {
                        throw new Error('Требуется api_key от CapMonster Cloud');
                    }
                    
                    let imageBase64 = params.image_base64;
                    
                    // Если передан селектор изображения, получаем его
                    if (!imageBase64 && params.image_selector) {
                        imageBase64 = await page.evaluate((selector) => {
                            const img = document.querySelector(selector);
                            if (!img) return null;
                            
                            // Создаем canvas для конвертации в base64
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            canvas.width = img.naturalWidth || img.width;
                            canvas.height = img.naturalHeight || img.height;
                            ctx.drawImage(img, 0, 0);
                            
                            return canvas.toDataURL('image/png').split(',')[1];
                        }, params.image_selector);
                        
                        if (!imageBase64) {
                            throw new Error(`Изображение не найдено по селектору: ${params.image_selector}`);
                        }
                    }
                    
                    if (!imageBase64) {
                        throw new Error('Требуется image_base64 или image_selector');
                    }
                    
                    const imageClient = CapMonsterCloudClientFactory.Create(new ClientOptions({ 
                        clientKey: params.api_key 
                    }));
                    
                    const imageRequest = new ImageToTextRequest({
                        body: imageBase64
                    });
                    
                    console.log('📷 Решение текстовой капчи по изображению');
                    const imageResult = await imageClient.Solve(imageRequest);
                    
                    // Автоматически вставляем текст в поле, если указан селектор
                    if (params.input_selector) {
                        await page.fill(params.input_selector, imageResult.solution.text);
                        result.message = 'Текстовая капча решена и вставлена в поле';
                    } else {
                        result.message = 'Текстовая капча решена';
                    }
                    
                    result.captcha_solution = imageResult;
                    result.captcha_text = imageResult.solution.text;
                    break;

                case 'captcha_turnstile':
                    // 🔐 Специализированный метод для Cloudflare Turnstile
                    loadCapMonsterClient(); // Загружаем клиент при необходимости
                    if (!params.api_key) {
                        throw new Error('Требуется api_key от CapMonster Cloud');
                    }
                    if (!params.website_url || !params.website_key) {
                        throw new Error('Требуются параметры: website_url, website_key');
                    }
                    
                    const turnstileClient = CapMonsterCloudClientFactory.Create(new ClientOptions({ 
                        clientKey: params.api_key 
                    }));
                    
                    const turnstileRequest = new TurnstileRequest({
                        websiteURL: params.website_url,
                        websiteKey: params.website_key,
                        action: params.turnstile_action,
                        cData: params.cdata,
                        chlPageData: params.chl_page_data,
                        userAgent: params.user_agent || await page.evaluate(() => navigator.userAgent),
                        proxy: params.proxy
                    });
                    
                    console.log(`🔐 Решение Cloudflare Turnstile для ${params.website_url}`);
                    const turnstileResult = await turnstileClient.Solve(turnstileRequest);
                    
                    // Автоматически вставляем решение в форму, если указан селектор
                    if (params.response_selector) {
                        await page.evaluate((selector, response) => {
                            const element = document.querySelector(selector);
                            if (element) {
                                element.value = response;
                                // Триггерим события для обновления
                                element.dispatchEvent(new Event('input', { bubbles: true }));
                                element.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }, params.response_selector, turnstileResult.solution.token);
                        
                        result.message = 'Cloudflare Turnstile решена и вставлена в форму';
                    } else {
                        result.message = 'Cloudflare Turnstile решена';
                    }
                    
                    result.captcha_solution = turnstileResult;
                    result.turnstile_token = turnstileResult.solution.token;
                    result.user_agent = turnstileResult.solution.userAgent;
                    break;

                case 'captcha_get_balance':
                    // 💰 Проверка баланса CapMonster Cloud
                    loadCapMonsterClient(); // Загружаем клиент при необходимости
                    if (!params.api_key) {
                        throw new Error('Требуется api_key от CapMonster Cloud');
                    }
                    
                    const balanceClient = CapMonsterCloudClientFactory.Create(new ClientOptions({ 
                        clientKey: params.api_key 
                    }));
                    
                    const balance = await balanceClient.getBalance();
                    result.balance = balance;
                    result.message = `Баланс CapMonster Cloud: $${balance.balance}`;
                    break;

                // 📊 Улучшенное извлечение данных
                case 'get_all_links':
                    const links = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll('a[href]')).map(a => ({
                            text: a.textContent.trim(),
                            href: a.href,
                            target: a.target
                        }));
                    });
                    result.links = links;
                    result.message = `Найдено ${links.length} ссылок`;
                    break;

                case 'get_page_info':
                    const pageInfo = await page.evaluate(() => ({
                        title: document.title,
                        url: location.href,
                        domain: location.hostname,
                        readyState: document.readyState,
                        cookies: document.cookie,
                        userAgent: navigator.userAgent,
                        viewport: {
                            width: window.innerWidth,
                            height: window.innerHeight
                        }
                    }));
                    result.page_info = pageInfo;
                    result.message = 'Информация о странице получена';
                    break;

                case 'wait_for_load':
                    const loadState = params.load_state || 'load';
                    await page.waitForLoadState(loadState, { timeout: params.timeout || 30000 });
                    result.message = `Страница загружена (${loadState})`;
                    break;

                default:
                    throw new Error(`Неизвестное действие: ${action}`);
            }

            // Добавляем общую информацию
            result.current_url = page.url();
            result.timestamp = new Date().toISOString();
            
            console.log(`✅ Действие ${action} выполнено успешно`);
            return result;

        } catch (error) {
            console.error(`❌ Ошибка выполнения действия ${action}:`, error.message);
            throw new Error(`Ошибка ${action}: ${error.message}`);
        }
    }

    /**
     * 🔴 Закрыть сессию браузера
     * @param {string} sessionId 
     * @returns {Promise<boolean>}
     */
    async closeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            console.warn(`⚠️ Сессия ${sessionId} уже закрыта или не существует`);
            return false;
        }

        try {
            console.log(`🔴 Закрытие сессии: ${sessionId}`);
            await session.browser.close();
            this.sessions.delete(sessionId);
            console.log(`✅ Сессия ${sessionId} закрыта`);
            return true;
        } catch (error) {
            console.error(`❌ Ошибка закрытия сессии ${sessionId}:`, error.message);
            this.sessions.delete(sessionId); // Удаляем из списка в любом случае
            return false;
        }
    }

    /**
     * 🧹 Автоматическая очистка старых сессий
     */
    startCleanupTimer() {
        // Очистка каждые 5 минут
        this.cleanup_interval = setInterval(() => {
            this.cleanupOldSessions();
        }, 5 * 60 * 1000);
    }

    /**
     * 🧹 Очистить старые неактивные сессии (старше 30 минут)
     */
    async cleanupOldSessions() {
        const now = new Date();
        const maxAge = 30 * 60 * 1000; // 30 минут

        for (const [sessionId, session] of this.sessions.entries()) {
            const age = now - session.last_activity;
            if (age > maxAge) {
                console.log(`🧹 Очистка старой сессии: ${sessionId} (неактивна ${Math.round(age/60000)} мин)`);
                await this.closeSession(sessionId);
            }
        }
    }

    /**
     * 📊 Получить информацию о всех сессиях
     */
    getSessionsInfo() {
        const sessions = [];
        for (const [sessionId, session] of this.sessions.entries()) {
            sessions.push({
                id: sessionId,
                created_at: session.created_at,
                last_activity: session.last_activity,
                initial_url: session.initial_url,
                current_url: session.page.url()
            });
        }
        return sessions;
    }

    /**
     * 🛑 Закрыть все сессии (для выключения)
     */
    async closeAllSessions() {
        console.log('🛑 Закрытие всех сессий браузера...');
        const promises = Array.from(this.sessions.keys()).map(id => this.closeSession(id));
        await Promise.all(promises);
        
        if (this.cleanup_interval) {
            clearInterval(this.cleanup_interval);
        }
        
        console.log('✅ Все сессии закрыты');
    }
}

// Создаем глобальный экземпляр менеджера
const sessionManager = new SessionManager();

// Грацeful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Получен сигнал SIGINT, закрываем все сессии...');
    await sessionManager.closeAllSessions();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Получен сигнал SIGTERM, закрываем все сессии...');
    await sessionManager.closeAllSessions();
    process.exit(0);
});

module.exports = sessionManager; 
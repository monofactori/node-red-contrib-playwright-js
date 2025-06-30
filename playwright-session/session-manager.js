const { chromium } = require('playwright');

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
            const context = await browser.newContext();
            const page = await context.newPage();
            
            // Переходим на начальную страницу
            if (url) {
                console.log(`🌐 Переход на: ${url}`);
                await page.goto(url, { 
                    waitUntil: 'networkidle', 
                    timeout: 60000 
                });
            }

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
                    await page.goto(params.url, { 
                        waitUntil: 'networkidle', 
                        timeout: 60000 
                    });
                    result.new_url = params.url;
                    result.message = `Переход на ${params.url}`;
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
                        'button[id*="accept"]', 'button[class*="accept"]',
                        'button[id*="cookie"]', 'button[class*="cookie"]',
                        'button:has-text("Accept")', 'button:has-text("Принять")',
                        'button:has-text("OK")', 'button:has-text("Согласен")',
                        '[data-testid*="accept"]', '[data-cy*="accept"]'
                    ];
                    
                    let clicked = false;
                    for (const selector of cookieSelectors) {
                        try {
                            await page.click(selector, { timeout: 2000 });
                            clicked = true;
                            break;
                        } catch (e) {
                            // Пробуем следующий селектор
                        }
                    }
                    result.message = clicked ? 'Cookie banner принят' : 'Cookie banner не найден';
                    break;

                case 'stealth_mode':
                    // Базовые настройки стелс-режима
                    await page.addInitScript(() => {
                        // Удаляем webdriver свойство
                        delete navigator.__proto__.webdriver;
                        
                        // Переопределяем геттер languages
                        Object.defineProperty(navigator, 'languages', {
                            get: () => ['ru-RU', 'ru', 'en-US', 'en'],
                        });
                        
                        // Переопределяем геттер plugins
                        Object.defineProperty(navigator, 'plugins', {
                            get: () => [1, 2, 3, 4, 5],
                        });
                    });
                    result.message = 'Стелс-режим активирован';
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
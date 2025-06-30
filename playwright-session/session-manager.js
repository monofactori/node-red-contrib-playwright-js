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
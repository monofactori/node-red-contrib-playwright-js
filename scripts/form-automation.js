const { chromium } = require('playwright');

async function fillForm(formData) {
    const browser = await chromium.launch({ 
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });
    const page = await browser.newPage();
    
    try {
        // Пример для формы обратной связи
        await page.goto(formData.url || 'https://httpbin.org/forms/post', { 
            waitUntil: 'networkidle', 
            timeout: 60000 
        });
        
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
        const screenshot = await page.screenshot({ type: 'png' });
        const screenshotBase64 = screenshot.toString('base64');
        
        console.log('Форма успешно заполнена');
        
        return {
            success: true,
            message: 'Форма заполнена',
            screenshot: screenshotBase64,
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
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });
    const page = await browser.newPage();
    
    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForLoadState('networkidle');
        
        const data = {};
        
        // Извлекаем данные по селекторам
        for (const [key, selector] of Object.entries(selectors)) {
            try {
                const element = await page.$(selector);
                if (element) {
                    const text = await element.textContent();
                    data[key] = text ? text.trim() : null;
                } else {
                    data[key] = null;
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
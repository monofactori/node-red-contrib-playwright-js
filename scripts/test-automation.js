const { chromium } = require('playwright');

async function runAutomation(url = 'https://example.com') {
    // Запускаем браузер с дополнительными флагами для стабильности на ARM/Pi
    const browser = await chromium.launch({ 
        headless: true, // используем headless режим для стабильности
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
        // Переходим на сайт
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        
        // Получаем заголовок страницы
        const title = await page.title();
        console.log('Заголовок страницы:', title);
        
        // Делаем скриншот
        const screenshot = await page.screenshot({ type: 'png' });
        const screenshotBase64 = screenshot.toString('base64');
        
        // Возвращаем результат
        return {
            success: true,
            title: title,
            screenshot: screenshotBase64,
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
const { chromium } = require('playwright');

async function runAutomation(url = 'https://example.com') {
    // Запускаем браузер с дополнительными флагами для стабильности на ARM/Pi
    const browser = await chromium.launch({ 
        headless: true,
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
        console.log(`🌐 Переход на: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        
        // Получаем заголовок страницы
        const title = await page.title();
        console.log('📄 Заголовок страницы:', title);
        
        // Делаем скриншот
        const screenshot = await page.screenshot({ type: 'png' });
        const screenshotBase64 = screenshot.toString('base64');
        console.log('📷 Скриншот готов');
        
        // Возвращаем результат
        return {
            success: true,
            title: title,
            url: page.url(),
            screenshot: screenshotBase64,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        return {
            success: false,
            error: error.message,
            url: url
        };
    } finally {
        await browser.close();
    }
}

// Функция для демонстрации работы с несколькими сессиями
async function createMultipleSessions() {
    console.log('🚀 Создание нескольких сессий для тестирования...');
    
    const sessions = [];
    const urls = [
        'https://example.com',
        'https://httpbin.org/get',
        'https://httpbin.org/forms/post'
    ];
    
    try {
        // Создаем несколько сессий
        for (let i = 0; i < urls.length; i++) {
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
            await page.goto(urls[i], { waitUntil: 'networkidle', timeout: 30000 });
            
            const sessionInfo = {
                id: `test_session_${i + 1}`,
                browser: browser,
                page: page,
                url: urls[i],
                title: await page.title(),
                created: new Date().toISOString()
            };
            
            sessions.push(sessionInfo);
            console.log(`✅ Сессия ${sessionInfo.id} создана для ${urls[i]}`);
        }
        
        console.log(`📊 Создано ${sessions.length} активных сессий`);
        
        // Информация о сессиях
        const sessionsInfo = sessions.map(s => ({
            id: s.id,
            url: s.url,
            title: s.title,
            created: s.created
        }));
        
        // Имитируем работу Node-RED - закрытие всех сессий
        console.log('🔴 Закрытие всех сессий...');
        for (const session of sessions) {
            await session.browser.close();
            console.log(`✅ Сессия ${session.id} закрыта`);
        }
        
        return {
            success: true,
            sessions_created: sessions.length,
            sessions_info: sessionsInfo,
            message: `Создано и закрыто ${sessions.length} сессий`,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Ошибка при работе с сессиями:', error.message);
        
        // Закрываем все открытые сессии в случае ошибки
        for (const session of sessions) {
            try {
                await session.browser.close();
            } catch (e) {
                console.warn(`⚠️ Не удалось закрыть сессию ${session.id}`);
            }
        }
        
        return {
            success: false,
            error: error.message,
            sessions_created: sessions.length
        };
    }
}

// Если скрипт запускается напрямую
if (require.main === module) {
    const command = process.argv[2] || 'test';
    
    if (command === 'multiple') {
        createMultipleSessions()
            .then(result => {
                console.log('🎭 Результат тестирования множественных сессий:');
                console.log(JSON.stringify(result, null, 2));
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Критическая ошибка:', error);
                process.exit(1);
            });
    } else {
        const url = process.argv[3] || 'https://example.com';
        runAutomation(url)
            .then(result => {
                console.log('🎭 Результат автоматизации:');
                console.log(JSON.stringify(result, null, 2));
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Критическая ошибка:', error);
                process.exit(1);
            });
    }
}

module.exports = { runAutomation, createMultipleSessions }; 
/**
 * 🤖 Пример использования CapMonster Cloud для решения капчи в Node-RED Playwright
 * 
 * Этот скрипт демонстрирует:
 * - Автоматическое решение ReCaptcha v2
 * - Автоматическое решение hCaptcha  
 * - Решение текстовых капч по изображению
 * - Проверку баланса CapMonster Cloud
 */

const sessionManager = require('../playwright-session/session-manager');

async function testCaptchaSolving() {
    console.log('🤖 Тестирование решения капчи с CapMonster Cloud');
    
    // ВАЖНО: Замените на ваш реальный API ключ от CapMonster Cloud
    const API_KEY = 'YOUR_CAPMONSTER_API_KEY';
    
    try {
        // 1. Создаем сессию браузера
        console.log('🟢 Создание сессии браузера...');
        const sessionId = await sessionManager.createSession('https://lessons.zennolab.com/captchas/recaptcha/v2_simple.php?level=high');
        
        // 2. Применяем стелс-режим
        console.log('🛡️ Применение стелс-режима...');
        await sessionManager.executeAction(sessionId, 'stealth_mode');
        
        // 3. Переходим на страницу с капчей
        console.log('🌐 Переход на тестовую страницу...');
        await sessionManager.executeAction(sessionId, 'navigate', {
            url: 'https://lessons.zennolab.com/captchas/recaptcha/v2_simple.php?level=high',
            waitUntil: 'networkidle'
        });
        
        // 4. Проверяем баланс CapMonster Cloud
        console.log('💰 Проверка баланса...');
        const balanceResult = await sessionManager.executeAction(sessionId, 'captcha_get_balance', {
            api_key: API_KEY
        });
        console.log(`Баланс: $${balanceResult.balance.balance}`);
        
        if (balanceResult.balance.balance < 0.001) {
            throw new Error('Недостаточно средств на балансе CapMonster Cloud');
        }
        
        // 5. Решаем ReCaptcha v2
        console.log('🔐 Решение ReCaptcha v2...');
        const captchaResult = await sessionManager.executeAction(sessionId, 'captcha_recaptcha_v2', {
            api_key: API_KEY,
            website_url: 'https://lessons.zennolab.com/captchas/recaptcha/v2_simple.php?level=high',
            website_key: '6Lcg7CMUAAAAANphynKgn9YAgA4tQ2KI_iqRyTwd',
            response_selector: '[name="g-recaptcha-response"]'
        });
        
        console.log('✅ ReCaptcha решена!');
        console.log('Response:', captchaResult.g_recaptcha_response.substring(0, 50) + '...');
        
        // 6. Отправляем форму
        console.log('📤 Отправка формы...');
        await sessionManager.executeAction(sessionId, 'click', {
            selector: 'input[type="submit"]'
        });
        
        // 7. Ждем результат
        await sessionManager.executeAction(sessionId, 'wait_for_text', {
            text: 'Congratulations',
            timeout: 10000
        });
        
        // 8. Делаем скриншот результата
        const screenshotResult = await sessionManager.executeAction(sessionId, 'screenshot', {
            full_page: true
        });
        
        console.log('📷 Скриншот успешного решения сохранен');
        
        // 9. Закрываем сессию
        await sessionManager.closeSession(sessionId);
        
        return {
            success: true,
            message: 'Капча решена успешно!',
            balance: balanceResult.balance.balance,
            captcha_response: captchaResult.g_recaptcha_response,
            screenshot: screenshotResult.screenshot
        };
        
    } catch (error) {
        console.error('❌ Ошибка при решении капчи:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

async function testImageCaptcha() {
    console.log('📷 Тестирование решения текстовой капчи');
    
    const API_KEY = 'YOUR_CAPMONSTER_API_KEY';
    
    try {
        // Создаем сессию и переходим на страницу с текстовой капчей
        const sessionId = await sessionManager.createSession();
        
        await sessionManager.executeAction(sessionId, 'navigate', {
            url: 'https://lessons.zennolab.com/captchas/basic'
        });
        
        // Решаем текстовую капчу по изображению
        const imageResult = await sessionManager.executeAction(sessionId, 'captcha_image', {
            api_key: API_KEY,
            image_selector: 'img.captcha-image',
            input_selector: 'input[name="captcha_code"]'
        });
        
        console.log('✅ Текстовая капча решена:', imageResult.captcha_text);
        
        // Отправляем форму
        await sessionManager.executeAction(sessionId, 'click', {
            selector: 'input[type="submit"]'
        });
        
        await sessionManager.closeSession(sessionId);
        
        return {
            success: true,
            captcha_text: imageResult.captcha_text
        };
        
    } catch (error) {
        console.error('❌ Ошибка при решении текстовой капчи:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Если скрипт запускается напрямую
if (require.main === module) {
    const testType = process.argv[2] || 'recaptcha';
    
    if (testType === 'image') {
        testImageCaptcha()
            .then(result => {
                console.log('🎭 Результат тестирования текстовой капчи:');
                console.log(JSON.stringify(result, null, 2));
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Критическая ошибка:', error);
                process.exit(1);
            });
    } else {
        testCaptchaSolving()
            .then(result => {
                console.log('🎭 Результат тестирования ReCaptcha:');
                console.log(JSON.stringify(result, null, 2));
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Критическая ошибка:', error);
                process.exit(1);
            });
    }
}

module.exports = { testCaptchaSolving, testImageCaptcha }; 
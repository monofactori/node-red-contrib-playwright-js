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
                const url = args[1] || 'https://example.com';
                result = await runAutomation(url);
                break;
                
            case 'screenshot':
                // Скриншот страницы
                const screenshotUrl = args[1] || 'https://example.com';
                result = await runAutomation(screenshotUrl);
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
                const scrapeUrl = args[1] || 'https://example.com';
                const selectors = args[2] ? JSON.parse(args[2]) : {
                    title: 'h1',
                    description: 'p'
                };
                result = await scrapePage(scrapeUrl, selectors);
                break;
                
            default:
                result = {
                    success: false,
                    error: 'Неизвестное действие. Доступные: test, screenshot, fill-form, scrape'
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
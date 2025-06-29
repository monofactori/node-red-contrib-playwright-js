module.exports = function(RED) {
    const { exec } = require('child_process');
    const path = require('path');
    const fs = require('fs');

    // Функция для выполнения Playwright скрипта
    async function executePlaywright(action, params) {
        return new Promise((resolve, reject) => {
            // Используем наш готовый скрипт
            const scriptPath = path.join(__dirname, '..', 'scripts', 'playwright-node-red.sh');
            
            let command;
            
            switch (action) {
                case 'test':
                    command = `${scriptPath} test "${params.url}"`;
                    break;
                case 'screenshot':
                    command = `${scriptPath} screenshot "${params.url}"`;
                    break;
                case 'screenshot-inline':
                    const scriptsDir = path.join(__dirname, '..', 'scripts');
                    command = `cd ${scriptsDir} && xvfb-run -a node -e "
                        const { chromium } = require('playwright');
                        (async () => {
                            const browser = await chromium.launch({ 
                                headless: true,
                                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-web-security', '--disable-features=VizDisplayCompositor']
                            });
                            const page = await browser.newPage();
                            await page.goto('${params.url}', { timeout: 60000 });
                            await page.waitForTimeout(${params.delay || 1000});
                            const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });
                            const title = await page.title();
                            await browser.close();
                            console.log(JSON.stringify({ success: true, screenshot, title, url: '${params.url}' }));
                        })().catch(err => console.log(JSON.stringify({ success: false, error: err.message })));
                    "`;
                    break;
                default:
                    return reject(new Error('Неизвестное действие: ' + action));
            }
            
            exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Ошибка выполнения Playwright:', error);
                    return reject(new Error(`Ошибка Playwright: ${error.message}`));
                }
                
                try {
                    // Пытаемся распарсить JSON результат
                    const result = JSON.parse(stdout.trim());
                    resolve(result);
                } catch (e) {
                    // Если не JSON, возвращаем как есть
                    resolve({ success: true, result: stdout.trim() });
                }
            });
        });
    }

    function PlaywrightAutomationNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        this.on('input', async function(msg) {
            try {
                // Получаем параметры из сообщения или конфигурации
                const action = msg.action || config.action || 'test';
                const url = msg.url || config.url;
                const delay = msg.delay || config.delay || 1000;
                
                // Проверяем что URL передан
                if (!url) {
                    throw new Error('URL не указан. Укажите URL в msg.url или в настройках узла');
                }
                
                // Валидация URL если нужен
                if ((action === 'screenshot' || action === 'test') && url) {
                    try {
                        new URL(url);
                    } catch (e) {
                        throw new Error(`Неправильный URL: ${url}`);
                    }
                }
                
                node.status({fill:"blue", shape:"dot", text:"Выполняется..."});
                node.log(`Запуск Playwright ${action} для ${url}`);
                
                // Выполняем действие
                const result = await executePlaywright(action, {
                    url: url,
                    delay: delay
                });
                
                if (result.success) {
                    // Успех
                    msg.payload = result;
                    node.status({fill:"green", shape:"dot", text:"Успешно"});
                    node.send([msg, null]);
                } else {
                    // Ошибка в скрипте
                    throw new Error(result.error || 'Неизвестная ошибка в скрипте');
                }
                
            } catch (e) {
                console.error('Ошибка в узле Playwright:', e);
                msg.payload = { 
                    success: false, 
                    error: e.message,
                    timestamp: new Date().toISOString()
                };
                node.status({fill:"red", shape:"ring", text:"Ошибка"});
                node.error(e, msg);
                // Отправляем ошибку на второй выход
                node.send([null, msg]);
            }
        });
        
        // Очистка при удалении узла
        this.on('close', function() {
            node.log("Узел Playwright Automation закрывается");
            node.status({});
        });
    }
    
    // Регистрируем узел в Node-RED
    RED.nodes.registerType("playwright-automation", PlaywrightAutomationNode);
} 
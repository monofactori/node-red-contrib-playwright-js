module.exports = function(RED) {
    const { exec } = require('child_process');
    const path = require('path');

    // Функция для выполнения клика по элементу
    async function executeClick(url, selector, options = {}) {
        return new Promise((resolve, reject) => {
            // Создаем inline скрипт для клика
            const clickScript = `
                const { chromium } = require('playwright');
                (async () => {
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
                        // Переходим на страницу
                        await page.goto('${url}');
                        await page.waitForLoadState('networkidle');
                        
                        // Делаем скриншот ДО клика (если нужно)
                        let screenshotBefore = null;
                        if (${options.screenshotBefore || false}) {
                            screenshotBefore = await page.screenshot({ encoding: 'base64', fullPage: true });
                        }
                        
                        // Ждем появления элемента
                        await page.waitForSelector('${selector}', { timeout: ${options.timeout || 10000} });
                        
                        // Получаем информацию об элементе перед кликом
                        const element = await page.$('${selector}');
                        if (!element) {
                            throw new Error('Элемент не найден: ${selector}');
                        }
                        
                        const elementInfo = await element.evaluate(el => ({
                            tagName: el.tagName,
                            textContent: el.textContent?.trim(),
                            href: el.href || null,
                            type: el.type || null,
                            className: el.className || null,
                            id: el.id || null
                        }));
                        
                        // Кликаем по элементу
                        await element.click();
                        
                        // Ждем после клика
                        await page.waitForTimeout(${options.waitAfterClick || 2000});
                        
                        // Получаем новый URL после клика
                        const newUrl = page.url();
                        
                        // Делаем скриншот ПОСЛЕ клика
                        const screenshotAfter = await page.screenshot({ encoding: 'base64', fullPage: true });
                        
                        // Получаем заголовок страницы
                        const title = await page.title();
                        
                        console.log(JSON.stringify({
                            success: true,
                            originalUrl: '${url}',
                            newUrl: newUrl,
                            title: title,
                            elementInfo: elementInfo,
                            screenshotBefore: screenshotBefore,
                            screenshotAfter: screenshotAfter,
                            timestamp: new Date().toISOString()
                        }));
                        
                    } catch (error) {
                        console.log(JSON.stringify({
                            success: false,
                            error: error.message,
                            originalUrl: '${url}',
                            selector: '${selector}',
                            timestamp: new Date().toISOString()
                        }));
                    } finally {
                        await browser.close();
                    }
                })();
            `;
            
            // Выполняем скрипт с xvfb
            const command = `cd /root/web-automation && xvfb-run -a node -e "${clickScript.replace(/"/g, '\\"')}"`;
            
            exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Ошибка выполнения клика:', error);
                    return reject(new Error(`Ошибка клика: ${error.message}`));
                }
                
                try {
                    // Парсим JSON результат
                    const result = JSON.parse(stdout.trim());
                    resolve(result);
                } catch (e) {
                    console.error('Ошибка парсинга результата:', e);
                    resolve({ 
                        success: false, 
                        error: 'Ошибка парсинга результата',
                        raw_output: stdout.trim()
                    });
                }
            });
        });
    }

    function PlaywrightClickerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        this.on('input', async function(msg) {
            try {
                // Получаем параметры из сообщения или конфигурации
                const url = msg.url || config.url;
                const selector = msg.selector || config.selector;
                const waitAfterClick = msg.waitAfterClick || config.waitAfterClick || 2000;
                const timeout = msg.timeout || config.timeout || 10000;
                const screenshotBefore = msg.screenshotBefore || config.screenshotBefore || false;
                
                // Валидация
                if (!url) {
                    throw new Error('URL обязателен для клика');
                }
                
                if (!selector) {
                    throw new Error('CSS селектор обязателен для клика');
                }
                
                try {
                    new URL(url);
                } catch (e) {
                    throw new Error(`Неправильный URL: ${url}`);
                }
                
                node.status({fill:"blue", shape:"dot", text:"Клик по элементу..."});
                node.log(`Клик по "${selector}" на ${url}`);
                
                // Выполняем клик
                const result = await executeClick(url, selector, {
                    waitAfterClick: waitAfterClick,
                    timeout: timeout,
                    screenshotBefore: screenshotBefore
                });
                
                if (result.success) {
                    // Успех
                    msg.payload = {
                        success: true,
                        originalUrl: result.originalUrl,
                        newUrl: result.newUrl,
                        title: result.title,
                        elementInfo: result.elementInfo,
                        screenshotBefore: result.screenshotBefore,
                        screenshotAfter: result.screenshotAfter,
                        timestamp: result.timestamp,
                        navigation: result.originalUrl !== result.newUrl ? 'Произошел переход' : 'Остались на той же странице'
                    };
                    
                    // Определяем статус
                    if (result.originalUrl !== result.newUrl) {
                        node.status({fill:"green", shape:"dot", text:"Клик + переход"});
                    } else {
                        node.status({fill:"green", shape:"ring", text:"Клик выполнен"});
                    }
                    
                    node.send([msg, null]);
                } else {
                    // Ошибка в скрипте
                    throw new Error(result.error || 'Неизвестная ошибка клика');
                }
                
            } catch (e) {
                console.error('Ошибка в узле клика:', e);
                msg.payload = { 
                    success: false, 
                    error: e.message,
                    url: msg.url || config.url,
                    selector: msg.selector || config.selector,
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
            node.log("Узел Playwright Clicker закрывается");
            node.status({});
        });
    }
    
    // Регистрируем узел в Node-RED
    RED.nodes.registerType("playwright-clicker", PlaywrightClickerNode);
} 
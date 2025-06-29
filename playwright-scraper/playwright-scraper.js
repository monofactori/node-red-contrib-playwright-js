module.exports = function(RED) {
    const { exec } = require('child_process');

    // Функция для выполнения скрапинга
    async function executeScraping(url, selectors) {
        return new Promise((resolve, reject) => {
            // Используем наш готовый скрипт для скрапинга
            const scriptPath = '/root/web-automation/playwright-node-red.sh';
            const selectorsJson = JSON.stringify(selectors).replace(/"/g, '\\"');
            const command = `${scriptPath} scrape "${url}" '${JSON.stringify(selectors)}'`;
            
            exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Ошибка выполнения скрапинга:', error);
                    return reject(new Error(`Ошибка скрапинга: ${error.message}`));
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

    function PlaywrightScraperNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        this.on('input', async function(msg) {
            try {
                // Получаем параметры из сообщения или конфигурации
                const url = msg.url || config.url;
                let selectors = msg.selectors || config.selectors;
                
                // Валидация URL
                if (!url) {
                    throw new Error('URL обязателен для скрапинга');
                }
                
                try {
                    new URL(url);
                } catch (e) {
                    throw new Error(`Неправильный URL: ${url}`);
                }
                
                // Обработка селекторов
                if (typeof selectors === 'string') {
                    try {
                        selectors = JSON.parse(selectors);
                    } catch (e) {
                        throw new Error('Селекторы должны быть в формате JSON');
                    }
                }
                
                if (!selectors || Object.keys(selectors).length === 0) {
                    // Селекторы по умолчанию
                    selectors = {
                        title: 'h1, title',
                        description: 'meta[name="description"]',
                        text: 'p'
                    };
                }
                
                node.status({fill:"blue", shape:"dot", text:"Скрапинг..."});
                node.log(`Скрапинг ${url} с селекторами: ${JSON.stringify(selectors)}`);
                
                // Выполняем скрапинг
                const result = await executeScraping(url, selectors);
                
                if (result.success) {
                    // Успех
                    msg.payload = {
                        success: true,
                        url: url,
                        data: result.data,
                        timestamp: result.timestamp,
                        selectors_used: selectors
                    };
                    node.status({fill:"green", shape:"dot", text:"Данные получены"});
                    node.send([msg, null]);
                } else {
                    // Ошибка в скрипте
                    throw new Error(result.error || 'Неизвестная ошибка скрапинга');
                }
                
            } catch (e) {
                console.error('Ошибка в узле скрапинга:', e);
                msg.payload = { 
                    success: false, 
                    error: e.message,
                    url: msg.url || config.url,
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
            node.log("Узел Playwright Scraper закрывается");
            node.status({});
        });
    }
    
    // Регистрируем узел в Node-RED
    RED.nodes.registerType("playwright-scraper", PlaywrightScraperNode);
} 
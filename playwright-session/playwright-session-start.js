module.exports = function(RED) {
    const sessionManager = require('./session-manager');

    function PlaywrightSessionStartNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        this.on('input', async function(msg) {
            try {
                // URL теперь необязателен! Браузер создается без навигации
                // Используйте действие "stealth_mode" а затем "navigate" для безопасного открытия сайтов
                const url = msg.url || config.url || null;

                node.status({fill:"blue", shape:"dot", text:"Создание сессии..."});
                node.log(`🟢 Создание новой браузерной сессии (без навигации)`);
                
                // Опции браузера из сообщения или конфигурации
                const browserOptions = msg.browser_options || config.browser_options || {};
                
                // Создаем сессию БЕЗ навигации (для безопасности)
                const sessionId = await sessionManager.createSession(url, browserOptions);
                
                // Формируем результат
                msg.session_id = sessionId;
                msg.browser_ready = true;
                msg.initial_url = url || null;
                msg.timestamp = new Date().toISOString();
                
                // Сохраняем оригинальный payload, добавляем метаданные
                if (!msg.payload || typeof msg.payload !== 'object') {
                    msg.payload = {};
                }
                
                Object.assign(msg.payload, {
                    success: true,
                    session_id: sessionId,
                    browser_ready: true,
                    initial_url: url || null,
                    message: 'Браузер создан. Используйте stealth_mode → navigate для безопасного серфинга',
                    timestamp: new Date().toISOString()
                });

                node.status({fill:"green", shape:"dot", text:`Сессия: ${sessionId.substring(0, 12)}...`});
                node.log(`✅ Сессия создана: ${sessionId}`);
                
                // Отправляем на первый выход (успех)
                node.send([msg, null]);
                
            } catch (error) {
                console.error('❌ Ошибка в playwright-session-start:', error);
                
                // Формируем сообщение об ошибке
                msg.payload = {
                    success: false,
                    error: error.message,
                    node: 'playwright-session-start',
                    timestamp: new Date().toISOString()
                };
                
                node.status({fill:"red", shape:"ring", text:"Ошибка создания"});
                node.error(error, msg);
                
                // Отправляем на второй выход (ошибка)
                node.send([null, msg]);
            }
        });
        
        // Очистка при удалении ноды
        this.on('close', function() {
            node.log("🟢 Нода playwright-session-start закрывается");
            node.status({});
        });
    }
    
    // Регистрируем ноду в Node-RED
    RED.nodes.registerType("playwright-session-start", PlaywrightSessionStartNode);
}; 
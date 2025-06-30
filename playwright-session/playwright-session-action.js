module.exports = function(RED) {
    const sessionManager = require('./session-manager');

    function PlaywrightSessionActionNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        this.on('input', async function(msg) {
            try {
                // Получаем session_id из сообщения или конфигурации
                const sessionId = msg.session_id || config.session_id;
                
                if (!sessionId) {
                    throw new Error('session_id обязателен. Получите его от ноды playwright-session-start');
                }

                // Получаем действие из сообщения или конфигурации
                const action = msg.action || config.action;
                
                if (!action) {
                    throw new Error('action обязателен. Укажите тип действия (fill_form, click, screenshot, etc.)');
                }

                // Параметры действия из сообщения или конфигурации
                const params = {
                    // Основные параметры
                    selector: msg.selector || config.selector,
                    value: msg.value !== undefined ? msg.value : config.value,
                    url: msg.url || config.url,
                    
                    // Параметры ожидания
                    timeout: msg.timeout || config.timeout,
                    wait_after: msg.wait_after || config.wait_after,
                    
                    // Параметры для заполнения множественных полей
                    fields: msg.fields || config.fields,
                    
                    // Параметры для скрапинга
                    selectors: msg.selectors || config.selectors,
                    
                    // Параметры для скриншота
                    full_page: msg.full_page || config.full_page,
                    
                    // Параметры для скролла
                    x: msg.x || config.x,
                    y: msg.y || config.y,
                    
                    // Параметры для JavaScript
                    code: msg.code || config.code,
                    
                    // Параметры для поиска текста
                    text: msg.text || config.text,
                    
                    // Дополнительные параметры из сообщения
                    ...msg.params
                };

                node.status({fill:"blue", shape:"dot", text:`${action}...`});
                node.log(`🔵 Выполнение действия: ${action} в сессии ${sessionId}`);
                
                // Выполняем действие в сессии
                const result = await sessionManager.executeAction(sessionId, action, params);
                
                // Сохраняем session_id для следующей ноды
                msg.session_id = sessionId;
                
                // Обновляем payload результатом
                if (!msg.payload || typeof msg.payload !== 'object') {
                    msg.payload = {};
                }
                
                Object.assign(msg.payload, result);
                
                // Добавляем дополнительные метаданные в корень сообщения
                msg.action_performed = action;
                msg.timestamp = result.timestamp;
                
                // Для скриншота добавляем специальные поля
                if (action === 'screenshot' && result.screenshot) {
                    msg.screenshot = result.screenshot;
                    msg.filename = `screenshot-${Date.now()}.png`;
                    msg.mimetype = 'image/png';
                }
                
                // Для извлечения данных
                if (action === 'scrape' && result.scraped_data) {
                    msg.scraped_data = result.scraped_data;
                }
                
                // Для получения текста
                if (action === 'get_text' && result.text !== undefined) {
                    msg.text = result.text;
                }
                
                // Для JavaScript
                if (action === 'execute_js' && result.js_result !== undefined) {
                    msg.js_result = result.js_result;
                }

                const statusText = action === 'screenshot' ? 'Скриншот готов' : 
                                  action === 'click' ? 'Клик выполнен' :
                                  action === 'fill_form' ? 'Поле заполнено' :
                                  action === 'scrape' ? 'Данные извлечены' :
                                  'Действие выполнено';
                
                node.status({fill:"green", shape:"dot", text: statusText});
                node.log(`✅ Действие ${action} выполнено успешно`);
                
                // Отправляем на первый выход (успех)
                node.send([msg, null]);
                
            } catch (error) {
                console.error('❌ Ошибка в playwright-session-action:', error);
                
                // Сохраняем session_id даже при ошибке
                const sessionId = msg.session_id || config.session_id;
                if (sessionId) {
                    msg.session_id = sessionId;
                }
                
                // Формируем сообщение об ошибке
                msg.payload = {
                    success: false,
                    error: error.message,
                    action: msg.action || config.action,
                    session_id: sessionId,
                    node: 'playwright-session-action',
                    timestamp: new Date().toISOString()
                };
                
                node.status({fill:"red", shape:"ring", text:"Ошибка действия"});
                node.error(error, msg);
                
                // Отправляем на второй выход (ошибка)
                node.send([null, msg]);
            }
        });
        
        // Очистка при удалении ноды
        this.on('close', function() {
            node.log("🔵 Нода playwright-session-action закрывается");
            node.status({});
        });
    }
    
    // Регистрируем ноду в Node-RED
    RED.nodes.registerType("playwright-session-action", PlaywrightSessionActionNode);
}; 
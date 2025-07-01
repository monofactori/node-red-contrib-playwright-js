module.exports = function(RED) {
    const sessionManager = require('./session-manager');

    function PlaywrightSessionEndNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        this.on('input', async function(msg) {
            try {
                // Проверяем режим работы: закрыть все или одну сессию
                const closeAll = msg.close_all !== undefined ? msg.close_all : config.close_all;
                
                if (closeAll) {
                    // Режим: Закрыть все сессии
                    node.status({fill:"blue", shape:"dot", text:"Закрытие всех сессий..."});
                    node.log(`🔴 Закрытие всех активных сессий`);
                    
                    // Получаем информацию о сессиях до закрытия
                    const sessionsInfo = sessionManager.getSessionsInfo();
                    const sessionCount = sessionsInfo.length;
                    
                    // Закрываем все сессии
                    await sessionManager.closeAllSessions();
                    
                    // Формируем результат
                    if (!msg.payload || typeof msg.payload !== 'object') {
                        msg.payload = {};
                    }
                    
                    Object.assign(msg.payload, {
                        success: true,
                        closed: sessionCount,
                        mode: 'close_all',
                        sessions_info: sessionsInfo,
                        message: sessionCount > 0 ? `Закрыто ${sessionCount} сессий` : 'Активных сессий не было',
                        timestamp: new Date().toISOString()
                    });

                    // Очищаем session_id из сообщения (все сессии закрыты)
                    delete msg.session_id;
                    
                    const statusText = sessionCount > 0 ? `Закрыто ${sessionCount} сессий` : "Сессий не было";
                    node.status({fill:"green", shape:"dot", text: statusText});
                    node.log(`✅ ${statusText}`);
                    
                    // Отправляем на первый выход (успех)
                    node.send([msg, null]);
                    
                } else {
                    // Режим: Закрыть одну сессию
                    const sessionId = msg.session_id || config.session_id;
                    
                    if (!sessionId) {
                        throw new Error('session_id обязателен для закрытия конкретной сессии. Используйте опцию "Закрыть все сессии" для массового закрытия');
                    }

                    node.status({fill:"blue", shape:"dot", text:"Закрытие сессии..."});
                    node.log(`🔴 Закрытие сессии: ${sessionId}`);
                    
                    // Закрываем конкретную сессию
                    const closed = await sessionManager.closeSession(sessionId);
                    
                    // Формируем результат
                    if (!msg.payload || typeof msg.payload !== 'object') {
                        msg.payload = {};
                    }
                    
                    Object.assign(msg.payload, {
                        success: true,
                        closed: closed,
                        mode: 'close_one',
                        session_id: sessionId,
                        message: closed ? 'Сессия закрыта успешно' : 'Сессия уже была закрыта',
                        timestamp: new Date().toISOString()
                    });

                    // Очищаем session_id из сообщения, так как сессия закрыта
                    delete msg.session_id;
                    
                    const statusText = closed ? "Сессия закрыта" : "Уже закрыта";
                    node.status({fill:"green", shape:"dot", text: statusText});
                    node.log(`✅ Сессия ${sessionId} ${closed ? 'закрыта' : 'уже была закрыта'}`);
                    
                    // Отправляем на первый выход (успех)
                    node.send([msg, null]);
                }
                
            } catch (error) {
                console.error('❌ Ошибка в playwright-session-end:', error);
                
                // Формируем сообщение об ошибке
                const closeAll = msg.close_all !== undefined ? msg.close_all : config.close_all;
                
                msg.payload = {
                    success: false,
                    error: error.message,
                    mode: closeAll ? 'close_all' : 'close_one',
                    session_id: closeAll ? undefined : (msg.session_id || config.session_id),
                    node: 'playwright-session-end',
                    timestamp: new Date().toISOString()
                };
                
                node.status({fill:"red", shape:"ring", text:"Ошибка закрытия"});
                node.error(error, msg);
                
                // Отправляем на второй выход (ошибка)
                node.send([null, msg]);
            }
        });
        
        // Очистка при удалении ноды
        this.on('close', function() {
            node.log("🔴 Нода playwright-session-end закрывается");
            node.status({});
        });
    }
    
    // Регистрируем ноду в Node-RED
    RED.nodes.registerType("playwright-session-end", PlaywrightSessionEndNode);
}; 
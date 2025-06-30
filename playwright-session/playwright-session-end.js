module.exports = function(RED) {
    const sessionManager = require('./session-manager');

    function PlaywrightSessionEndNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        this.on('input', async function(msg) {
            try {
                // Получаем session_id из сообщения или конфигурации
                const sessionId = msg.session_id || config.session_id;
                
                if (!sessionId) {
                    throw new Error('session_id обязателен для закрытия сессии');
                }

                node.status({fill:"blue", shape:"dot", text:"Закрытие сессии..."});
                node.log(`🔴 Закрытие сессии: ${sessionId}`);
                
                // Закрываем сессию
                const closed = await sessionManager.closeSession(sessionId);
                
                // Формируем результат
                if (!msg.payload || typeof msg.payload !== 'object') {
                    msg.payload = {};
                }
                
                Object.assign(msg.payload, {
                    success: true,
                    closed: closed,
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
                
            } catch (error) {
                console.error('❌ Ошибка в playwright-session-end:', error);
                
                // Формируем сообщение об ошибке
                msg.payload = {
                    success: false,
                    error: error.message,
                    session_id: msg.session_id || config.session_id,
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
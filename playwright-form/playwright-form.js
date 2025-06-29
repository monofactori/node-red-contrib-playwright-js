module.exports = function(RED) {
    const { exec } = require('child_process');

    // Функция для выполнения автоматизации форм
    async function executeFormAutomation(url, formData) {
        return new Promise((resolve, reject) => {
            // Используем наш готовый скрипт для форм
            const scriptPath = '/root/web-automation/playwright-node-red.sh';
            const formDataJson = JSON.stringify(formData);
            const command = `${scriptPath} fill-form '${formDataJson}'`;
            
            exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Ошибка выполнения автоматизации форм:', error);
                    return reject(new Error(`Ошибка автоматизации форм: ${error.message}`));
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

    function PlaywrightFormNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        this.on('input', async function(msg) {
            try {
                // Получаем параметры из сообщения или конфигурации
                const url = msg.url || config.url;
                let formData = msg.formData || msg.payload || {};
                
                // Добавляем URL в данные формы если он есть
                if (url) {
                    formData.url = url;
                }
                
                // Валидация
                if (!formData.url) {
                    throw new Error('URL обязателен для автоматизации форм');
                }
                
                try {
                    new URL(formData.url);
                } catch (e) {
                    throw new Error(`Неправильный URL: ${formData.url}`);
                }
                
                // Добавляем поля из конфигурации если они не переданы в сообщении
                if (config.name && !formData.name) formData.name = config.name;
                if (config.email && !formData.email) formData.email = config.email;
                if (config.message && !formData.message) formData.message = config.message;
                
                node.status({fill:"blue", shape:"dot", text:"Заполнение формы..."});
                node.log(`Заполнение формы на ${formData.url}`);
                
                // Выполняем автоматизацию формы
                const result = await executeFormAutomation(formData.url, formData);
                
                if (result.success) {
                    // Успех
                    msg.payload = {
                        success: true,
                        url: formData.url,
                        message: result.message,
                        timestamp: result.timestamp,
                        form_data_used: formData
                    };
                    node.status({fill:"green", shape:"dot", text:"Форма заполнена"});
                    node.send([msg, null]);
                } else {
                    // Ошибка в скрипте
                    throw new Error(result.error || 'Неизвестная ошибка заполнения формы');
                }
                
            } catch (e) {
                console.error('Ошибка в узле автоматизации форм:', e);
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
            node.log("Узел Playwright Form закрывается");
            node.status({});
        });
    }
    
    // Регистрируем узел в Node-RED
    RED.nodes.registerType("playwright-form", PlaywrightFormNode);
} 
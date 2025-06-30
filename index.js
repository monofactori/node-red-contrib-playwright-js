module.exports = function(RED) {
    // 🎭 Система сессий браузера для веб-серфинга (v0.2.0)
    // Упрощенная архитектура: Старт → Действия → Конец
    
    require('./playwright-session/playwright-session-start.js')(RED);
    require('./playwright-session/playwright-session-action.js')(RED);
    require('./playwright-session/playwright-session-end.js')(RED);
    
    console.log('🎭 Node-RED Playwright Web Surfing v0.2.0 загружен');
    console.log('📋 Доступны 3 ноды: session-start, session-action, session-end');
}; 
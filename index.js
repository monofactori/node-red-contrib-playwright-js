module.exports = function(RED) {
    // Загружаем и регистрируем все узлы Playwright
    require('./playwright-automation/playwright-automation.js')(RED);
    require('./playwright-scraper/playwright-scraper.js')(RED);
    require('./playwright-form/playwright-form.js')(RED);
    require('./playwright-clicker/playwright-clicker.js')(RED);
}; 
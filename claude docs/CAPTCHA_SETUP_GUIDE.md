# 🤖 Быстрое руководство по настройке капчи

## 📋 Пошаговая инструкция

### **Шаг 1: Получение API ключа CapMonster Cloud**
1. Перейдите на https://capmonster.cloud/Dashboard
2. Зарегистрируйтесь или войдите в аккаунт
3. Пополните баланс (минимум $5 для стабильной работы)
4. Скопируйте API ключ из личного кабинета

### **Шаг 2: Установка зависимости**
```bash
# Переходим в папку Node-RED
cd ~/.node-red

# Устанавливаем клиент CapMonster Cloud
npm install @zennolab_com/capmonstercloud-client

# Обновляем модуль
npm install /root/node-red-contrib-playwright-js

# Перезапускаем Node-RED
sudo systemctl restart nodered
```

### **Шаг 3: Создание простого flow**
1. Откройте Node-RED: http://192.168.1.45:1880
2. Перетащите 3 ноды: `inject` → `session-start` → `session-action` → `debug`
3. Настройте ноды:

**session-start:**
- URL: `https://lessons.zennolab.com/captchas/recaptcha/v2_simple.php?level=high`

**session-action:**
- Действие: `ReCaptcha v2` 
- CapMonster API ключ: `ВАШ_API_КЛЮЧ`
- URL сайта: `https://lessons.zennolab.com/captchas/recaptcha/v2_simple.php?level=high`
- Site Key: `6Lcg7CMUAAAAANphynKgn9YAgA4tQ2KI_iqRyTwd`
- Селектор ответа: `[name="g-recaptcha-response"]`

4. Подключите и разверните flow
5. Нажмите на inject для тестирования

## 🎯 **Быстрые примеры использования**

### **Проверка баланса:**
```json
{
  "action": "captcha_get_balance",
  "api_key": "YOUR_API_KEY"
}
```

### **ReCaptcha v2:**
```json
{
  "action": "captcha_recaptcha_v2",
  "api_key": "YOUR_API_KEY",
  "website_url": "https://site.com",
  "website_key": "6Le-wvkSAAAAAPBMRTvw...",
  "response_selector": "[name='g-recaptcha-response']"
}
```

### **Текстовая капча:**
```json
{
  "action": "captcha_image",
  "api_key": "YOUR_API_KEY",
  "image_selector": "img.captcha",
  "input_selector": "input[name='captcha']"
}
```

## 🔧 **Настройка через переменные окружения**

Для безопасности API ключа используйте глобальные переменные Node-RED:

1. В Node-RED перейдите в меню → Settings → Context Data
2. Добавьте глобальную переменную:
   - Ключ: `capmonster_api_key`
   - Значение: `ваш_api_ключ`

3. В session-action используйте:
```javascript
msg.api_key = global.get('capmonster_api_key');
return msg;
```

## 💡 **Полный пример flow для автоматической регистрации**

```
[inject] → [session-start] → [stealth_mode] → [fill_email] → [fill_password] → [captcha_recaptcha_v2] → [click_submit] → [session-end]
```

1. **inject:** `{}`
2. **session-start:** `{"url": "https://site.com/register"}`
3. **stealth_mode:** `{"action": "stealth_mode"}`
4. **fill_email:** `{"action": "fill_form", "selector": "input[name='email']", "value": "test@example.com"}`
5. **fill_password:** `{"action": "fill_form", "selector": "input[name='password']", "value": "SecurePass123"}`
6. **captcha_recaptcha_v2:** Настройки капчи
7. **click_submit:** `{"action": "click", "selector": "button[type='submit']"}`
8. **session-end:** `{}`

## 📊 **Мониторинг расходов**

Добавьте ноду проверки баланса в начало flow:
```javascript
// В function ноде
if (msg.balance && msg.balance.balance < 1.0) {
    node.error("Недостаточно средств на балансе CapMonster Cloud!");
    return null;
}
return msg;
```

## 🚨 **Решение проблем**

### **Ошибка "MODULE_NOT_FOUND":**
```bash
cd ~/.node-red
npm install @zennolab_com/capmonstercloud-client
sudo systemctl restart nodered
```

### **Ошибка "API key is required":**
- Проверьте правильность API ключа
- Убедитесь что поле не пустое
- Попробуйте передать через msg.api_key

### **Капча не решается:**
- Проверьте баланс аккаунта
- Убедитесь в правильности website_key
- Попробуйте другой website_url

### **Timeout ошибки:**
- Увеличьте timeout до 120000 (2 минуты)
- Проверьте стабильность интернет соединения

## 🎭 **Готово к использованию!**

Теперь ваш Node-RED может автоматически решать любые капчи! 

**Стоимость:** ~$0.001 за ReCaptcha (~1000 капч за $1)**

**Поддерживаемые типы:**
- ✅ ReCaptcha v2
- ✅ hCaptcha  
- ✅ Текстовые капчи
- 🔄 ReCaptcha v3 (скоро)
- 🔄 FunCaptcha (планируется) 
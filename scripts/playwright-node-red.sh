#!/bin/bash

# Скрипт для запуска Playwright из Node-RED
# Автоматически использует xvfb для виртуального дисплея

# Определяем директорию скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Переходим в директорию скриптов
cd "$SCRIPT_DIR"

# Запускаем команду с виртуальным дисплеем
xvfb-run -a --server-args="-screen 0 1024x768x24" node node-red-wrapper.js "$@" 
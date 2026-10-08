# 🎵 VORTEX AUDIO

> Проверяй тексты песен на нецензурный контент за секунды

**VORTEX AUDIO** — это веб-приложение, которое помогает узнать, о чём поётся в песне, и проверить, безопасен ли текст для детей. Сервис анализирует текст через Genius API и проверяет его по обширной базе плохих слов.

---

## 🚀 Возможности

- 🎤 **Проверка текста** — введи название и автора, получи вердикт «Чисто» / «Грязь» / «Инструментал»
- 🎯 **Оценка от 1 до 10** — текст, бит и общая оценка песни
- 📄 **Просмотр текста** — с подсветкой нецензурных слов
- 🌐 **Перевод** — перевод текста на русский язык
- 👤 **Профиль** — регистрация, аватар, баланс нот
- 💎 **Подписки** — Бронза, Золото, Бриллиант
- 🎧 **Партнёрские ссылки** — слушай в Яндекс.Музыке, Spotify, YouTube Music, VK
- 📰 **Новости** — обновления сервиса
- 🏆 **Таблица лидеров** — топ пользователей
- 🎓 **Туториал** — обучение для новых пользователей
- 🏆 **Достижения** — за активность

---

## 🏗 Архитектура

**VORTEX AUDIO** — клиент-серверное приложение:

### Frontend (статический)
- **HTML** / **CSS** / **JavaScript**
- Многостраничное приложение (**index.html**, **auth.html**, **dashboard.html**, **result.html** и др.)
- **localStorage** для хранения сессии
- **fetch** для запросов к API

### Backend (Flask)
- **Python** + **Flask** + **Flask-CORS**
- **lyricsgenius** для получения текстов
- **Genius API** — источник текстов песен
- **JSON** файлы (`users.json`, `news.json`) для хранения данных

---

## 📖 Документация

Полная документация проекта доступна на **DeepWiki**:

[![DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/SecretKot256/VORTEX-AUDIO)

---

## 🔧 Технологии

- **Python 3.11** + **Flask**
- **lyricsgenius** — поиск текстов
- **HTML5** / **CSS3** / **JavaScript** (Vanilla)
- **Geogrotesque Cyr** — шрифт
- **SnapDeploy** — хостинг бэкенда
- **GitHub Pages** — хостинг фронтенда

---

## 🌐 Ссылки

- 🌍 **Сайт**: [secretkot256.github.io/VORTEX-AUDIO](https://secretkot256.github.io/VORTEX-AUDIO/)
- 🔌 **API**: [vortex-audio-2ea62.containers.snapdeploy.app](https://vortex-audio-2ea62.containers.snapdeploy.app)
- 📖 **Документация**: [deepwiki.com/SecretKot256/VORTEX-AUDIO](https://deepwiki.com/SecretKot256/VORTEX-AUDIO)

---

## 👥 Команда

**Team Vortex** — основано в 2026 году.

- 🎯 **Основатель и разработчик**: SecretKot256

---

## 📜 Лицензия

© 2026 Team Vortex. Все права защищены.

---

## 🙏 Благодарности

- **Genius** — за тексты песен
- **DeepWiki** — за документацию
- **SnapDeploy** — за хостинг

# Портфолио — Фирдавс

Статический сайт на HTML/CSS/JS без сборки.

**Начать отсюда:**

1. [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — что не меняется: визуальный язык,
   токены, правила текста, грабли этого кода. Прочитать целиком перед первой правкой.
2. [CURRENT_STATE.md](CURRENT_STATE.md) — что сделано, что осталось, известные
   ограничения. Обновлять по ходу работы.
3. [content/UX Copywriting Rules.md](content/UX%20Copywriting%20Rules.md) — правила
   текста, если задача про копирайт.

[START_HERE.md](START_HERE.md) — исторический документ от передачи проекта, часть
описаний устарела. Читать как справку о замысле, не как инструкцию.

## Структура

```
index.html               — главная
case-racktables.html      — кейс RackTables
css/
  fonts.css               — локальные @font-face (Geist/Geist Mono, latin+cyrillic)
  tokens.css              — дизайн-токены (цвета, шрифты)
  base.css                — навбар, разделители, общие классы
  index.css               — стили главной
  case.css                — стили кейса
js/
  navbar.js               — скрытие навбара при скролле (обе страницы)
  hero-canvas.js           — частицы в хиро главной
  soon-canvas.js           — статичная россыпь в слоте "не собрано"
  annotations.js           — хотспоты на дашборде в кейсе
  section-nav.js           — нижняя навигация по разделам кейса
assets/
  img/                    — изображения
  fonts/                  — Geist/Geist Mono woff2, только latin+cyrillic (~60KB суммарно)
```

## Локальная разработка

Статика, сервер не нужен — можно открывать `index.html` напрямую или поднять любой статик-сервер:

```bash
npx serve .
```

## Деплой

Cloudflare Pages, подключён к этому репозиторию: build command — нет (пусто), output directory — `/`.

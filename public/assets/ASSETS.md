# FAVORIT V4 — Asset Slots

Сайт построен вокруг 5 слотов изображений. **Чтобы получить финальный
премиальный сайт, замените 5 файлов в `public/assets/` — код менять не нужно.**

| Файл | Слот (Visual Bible) | Где используется | Рекомендации |
|---|---|---|---|
| `hero.jpg` | A01 Hero Main | Hero главной, og:image | ≥2400×1100, 21:9–16:9, тёмный низ/лево под текст |
| `wholesale.jpg` | B01 Терминал | Карточка «Опт» на главной + хедер раздела «Опт» | ≥1920×1080 |
| `stations.jpg` | C01 АЗС | Карточка «АЗС» + хедер раздела «Заправки» | ≥1920×1080 |
| `transport.jpg` | D01 Движение | Карточка «Транспорт» + хедер раздела «Транспорт» | ≥1920×1080 |
| `about.jpg` | E01 Панорама | Хедер раздела «О компании» | ≥1920×1080 |

Формат: JPG (sRGB). Тексты/alt задаются в `src/config/assets.ts`.

## Текущие временные placeholder-ы

Временные изображения подобраны под канон GOLDEN STEEL и транспортный канон
(MAN ночью, остров света АЗС, ночной терминал). Подлежат замене финальными
AI-ассетами Wave 1 (A01/B01/C01/D01/E01). Источники:

- `hero.jpg` — MAN с полуприцепом ночью, фары (Pexels #11053640, Sergei Skrynnik, Pexels License) — https://www.pexels.com/photo/photo-of-a-white-truck-with-lights-11053640/
- `wholesale.jpg` — “Blue hour fog over Preemraff oil refinery” (W.carter, Wikimedia Commons) — https://commons.wikimedia.org/wiki/File:Blue_hour_fog_over_Preemraff_oil_refinery_by_Brofjorden.jpg
- `stations.jpg` — минималистичный навес АЗС ночью (Pexels #92077, Markus Spiske, Pexels License) — https://www.pexels.com/photo/gasoline-station-during-night-time-92077/
- `transport.jpg` — тот же MAN ночью, плотный кроп по кабине (Pexels #11053640)
- `about.jpg` — ночная аэропанорама НПЗ (Pexels #10407689, Tom Fisk, Pexels License) — https://www.pexels.com/photo/oil-refinery-at-night-10407689/

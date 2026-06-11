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

Временные изображения подобраны под канон GOLDEN STEEL (сумерки, янтарный
свет, силуэты индустрии) из Wikimedia Commons. Подлежат замене финальными
ассетами Wave 1. Источники (для атрибуции):

- `hero.jpg` — “Oil refinery in the sunset” (U.S. National Archives, public domain) — https://commons.wikimedia.org/wiki/File:OIL_REFINERY_IN_THE_SUNSET_-_NARA_-_546384.jpg
- `wholesale.jpg` — “Blue hour fog over Preemraff oil refinery by Brofjorden” (W.carter) — https://commons.wikimedia.org/wiki/File:Blue_hour_fog_over_Preemraff_oil_refinery_by_Brofjorden.jpg
- `stations.jpg` — “Truck fueling, GO Gas Station at Highway 40 during sunset” — https://commons.wikimedia.org/wiki/File:Truck_fueling,_GO_Gas_Station_at_Highway_40_during_sunset.jpg
- `transport.jpg` — “M50 At Night” — https://commons.wikimedia.org/wiki/File:M50-At-Night.jpeg
- `about.jpg` — “Preemraff at sunset as seen from Norrkila 1” (W.carter) — https://commons.wikimedia.org/wiki/File:Preemraff_at_sunset_as_seen_from_Norrkila_1.jpg

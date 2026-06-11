// ЕДИНАЯ СИСТЕМА ASSET SLOTS (FAVORIT V4).
//
// Каждый слот — один файл в public/assets/ с фиксированным именем.
// Чтобы заменить визуал на финальный (AI/CGI/фото), достаточно положить
// новый JPG с тем же именем — код менять не нужно.
//
// Слоты:
//   hero.jpg       — главный hero (A01, рекомендуемо ≥2400×1100, 21:9–16:9)
//   wholesale.jpg  — опт: терминал/налив (B01, ≥1920×1080)
//   stations.jpg   — АЗС: навес ночью (C01, ≥1920×1080)
//   transport.jpg  — транспорт: цистерна в движении (D01, ≥1920×1080)
//   about.jpg      — о компании: панорама инфраструктуры (E01, ≥1920×1080)

export interface AssetSlot {
  src: string
  alt: string
}

export const assets = {
  hero: {
    src: '/assets/hero.jpg',
    alt: 'Инфраструктура топливного терминала в сумерках',
  },
  wholesale: {
    src: '/assets/wholesale.jpg',
    alt: 'Топливный терминал с резервуарами в синий час',
  },
  stations: {
    src: '/assets/stations.jpg',
    alt: 'Заправка техники на станции в сумерках',
  },
  transport: {
    src: '/assets/transport.jpg',
    alt: 'Ночная трасса с огнями движущегося транспорта',
  },
  about: {
    src: '/assets/about.jpg',
    alt: 'Силуэты резервуаров терминала на закате',
  },
} as const satisfies Record<string, AssetSlot>

export type AssetSlotName = keyof typeof assets

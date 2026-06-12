// ЕДИНАЯ СИСТЕМА ASSET SLOTS (FAVORIT V6).
//
// Базовые hero-слоты сохраняют стабильные имена в public/assets/.
// Это позволяет делать visual pass без перестройки структуры страниц.
// Дополнительные слоты используются только там, где одной hero-картинки
// недостаточно для вторичных секций.

export interface AssetSlot {
  src: string
  alt: string
}

export const assets = {
  hero: {
    src: '/assets/hero.jpg',
    alt: 'Терминал СУГ с резервуарами и LPG-инфраструктурой в ночной подсветке',
  },
  wholesale: {
    src: '/assets/wholesale.jpg',
    alt: 'Нефтебаза и терминальная инфраструктура для оптовых поставок в сумерках',
  },
  stations: {
    src: '/assets/stations.jpg',
    alt: 'Фирменная автозаправочная станция Фаворит в вечернем свете',
  },
  transport: {
    src: '/assets/transport.jpg',
    alt: 'MAN TGX с LPG-цистерной на территории промышленного терминала ночью',
  },
  transportHero: {
    src: '/assets/transport-hero.jpg',
    alt: 'Отдельный hero-визуал собственного парка Фаворит для транспортного раздела',
  },
  transportSafety: {
    src: '/assets/transport-safety.jpg',
    alt: 'Крупный план LPG-цистерны с маркировкой Огнеопасно',
  },
  transportDetail: {
    src: '/assets/transport-detail.jpg',
    alt: 'Крупный план тягача MAN и LPG-цистерны как части собственного парка',
  },
  infrastructure: {
    src: '/assets/infrastructure.jpg',
    alt: 'Резервуары СУГ и терминальная инфраструктура в вечернем свете',
  },
  stationsSecondary: {
    src: '/assets/stations-secondary.jpg',
    alt: 'Деталь фирменной АЗС Фаворит с навесом и топливораздаточными колонками',
  },
  about: {
    src: '/assets/about.jpg',
    alt: 'Силуэты резервуаров терминала на закате',
  },
} as const satisfies Record<string, AssetSlot>

export type AssetSlotName = keyof typeof assets

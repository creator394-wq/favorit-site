// ЕДИНОЕ МЕСТО РЕДАКТИРОВАНИЯ ДАННЫХ АЗС.
// Цены, адреса и режим работы меняются только здесь —
// компоненты подхватят изменения автоматически.

export interface FuelPrice {
  fuel: string
  price: string
}

export interface GasStation {
  name: string
  address: string
  schedule: string
  prices: FuelPrice[]
}

export const gasStations: GasStation[] = [
  {
    name: 'АЗС №1',
    address: 'Адрес будет добавлен позже',
    schedule: 'Режим работы будет добавлен позже',
    prices: [
      { fuel: 'АИ-92', price: '—' },
      { fuel: 'АИ-95', price: '—' },
      { fuel: 'ДТ', price: '—' },
      { fuel: 'СУГ', price: '—' },
    ],
  },
  {
    name: 'АЗС №2',
    address: 'Адрес будет добавлен позже',
    schedule: 'Режим работы будет добавлен позже',
    prices: [
      { fuel: 'АИ-92', price: '—' },
      { fuel: 'АИ-95', price: '—' },
      { fuel: 'ДТ', price: '—' },
      { fuel: 'СУГ', price: '—' },
    ],
  },
]

// ЕДИНОЕ МЕСТО РЕДАКТИРОВАНИЯ ДАННЫХ АЗС.
// Адреса и режим работы меняются здесь; цены топлива вынесены
// в src/data/prices.json (E1 Price Data Layer) — их можно обновлять
// без правки UI-кода. Компоненты подхватят изменения автоматически.

import pricesData from './prices.json'

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

/** Дата последнего обновления цен (ISO), для отображения «Обновлено …». */
export const pricesUpdatedAt = pricesData.updatedAt

// Прайс конкретной АЗС из data-слоя → строки табло (порядок и подписи сохранены).
type StationFuel = { ai92: string; ai95: string; dt: string; gas: string }
function toPrices(fuel: StationFuel): FuelPrice[] {
  return [
    { fuel: 'АИ-92', price: fuel.ai92 },
    { fuel: 'АИ-95', price: fuel.ai95 },
    { fuel: 'ДТ', price: fuel.dt },
    { fuel: 'СУГ', price: fuel.gas },
  ]
}

export const gasStations: GasStation[] = [
  {
    name: pricesData.stations.azs1.name,
    address: 'Адрес будет добавлен позже',
    schedule: 'Режим работы будет добавлен позже',
    prices: toPrices(pricesData.stations.azs1.fuel),
  },
  {
    name: pricesData.stations.azs2.name,
    address: 'Адрес будет добавлен позже',
    schedule: 'Режим работы будет добавлен позже',
    prices: toPrices(pricesData.stations.azs2.fuel),
  },
]

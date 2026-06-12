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

// Единый прайс из data-слоя → строки табло (порядок и подписи сохранены).
const fuelPrices: FuelPrice[] = [
  { fuel: 'АИ-92', price: pricesData.fuel.ai92 },
  { fuel: 'АИ-95', price: pricesData.fuel.ai95 },
  { fuel: 'ДТ', price: pricesData.fuel.dt },
  { fuel: 'СУГ', price: pricesData.fuel.gas },
]

export const gasStations: GasStation[] = [
  {
    name: 'АЗС №1',
    address: 'Адрес будет добавлен позже',
    schedule: 'Режим работы будет добавлен позже',
    prices: fuelPrices,
  },
  {
    name: 'АЗС №2',
    address: 'Адрес будет добавлен позже',
    schedule: 'Режим работы будет добавлен позже',
    prices: fuelPrices,
  },
]

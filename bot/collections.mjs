// E12/E13/E18/E19 — коллекции данных: новости, акции, техника, ТО.
// Все через общий makeCollection (CRUD по id/префиксу).

import { makeCollection } from './store.mjs'

export const news = makeCollection('news.json', 'news')
export const promos = makeCollection('promos.json', 'promos')
export const trucks = makeCollection('trucks.json', 'trucks')
export const maintenance = makeCollection('maintenance.json', 'maintenance')

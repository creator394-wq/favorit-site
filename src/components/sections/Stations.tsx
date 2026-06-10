import { Clock, Fuel, MapPin } from 'lucide-react'
import { gasStations } from '../../data/gasStations'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

export function Stations() {
  return (
    <section id="azs" className="relative py-24 lg:py-32">
      <div className="pointer-events-none absolute top-0 right-0 h-80 w-80 rounded-full bg-amber-400/6 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            badge="Заправки"
            title="Наши АЗС"
            subtitle="Собственные автозаправочные станции с актуальными ценами на топливо."
          />
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          {gasStations.map((station, i) => (
            <Reveal key={station.name} delay={i * 120}>
              <div className="group glass relative overflow-hidden rounded-3xl p-7 transition-all duration-500 hover:border-accent-500/30 lg:p-9">
                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-accent-500/0 blur-3xl transition-all duration-700 group-hover:bg-accent-500/12" />

                <div className="flex items-center gap-4">
                  <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-flame-600 shadow-lg shadow-accent-500/25">
                    <Fuel className="h-6 w-6 text-white" />
                  </span>
                  <h3 className="font-display text-xl font-bold text-white lg:text-2xl">
                    {station.name}
                  </h3>
                </div>

                <div className="mt-6 space-y-3">
                  <p className="flex items-start gap-3 text-sm text-zinc-400">
                    <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent-400" />
                    {station.address}
                  </p>
                  <p className="flex items-start gap-3 text-sm text-zinc-400">
                    <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent-400" />
                    {station.schedule}
                  </p>
                </div>

                <div className="mt-7 overflow-hidden rounded-2xl border border-white/8">
                  <div className="grid grid-cols-2 bg-white/4 px-5 py-3 text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                    <span>Топливо</span>
                    <span className="text-right">Цена, ₽/л</span>
                  </div>
                  {station.prices.map((p) => (
                    <div
                      key={p.fuel}
                      className="grid grid-cols-2 items-center border-t border-white/6 px-5 py-3.5 transition-colors duration-300 hover:bg-accent-500/6"
                    >
                      <span className="font-semibold text-white">{p.fuel}</span>
                      <span className="text-right font-display text-lg font-bold text-accent-400">
                        {p.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mt-8 text-sm text-zinc-500">
            Цены носят информационный характер. Актуальную стоимость уточняйте на АЗС.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

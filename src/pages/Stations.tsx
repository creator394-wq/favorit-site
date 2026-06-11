import { Clock, MapPin } from 'lucide-react'
import { gasStations } from '../data/gasStations'
import { assets } from '../config/assets'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'

export function Stations() {
  return (
    <>
      <PageHeader
        image={assets.stations}
        kicker="Заправки"
        title="Наши АЗС"
        subtitle="Собственные автозаправочные станции. Актуальные цены на топливо — ниже."
      />

      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:mt-20 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {gasStations.map((station, i) => (
            <Reveal key={station.name} delay={i * 110} className="h-full">
              <div className="flex h-full flex-col border border-white/10 bg-graphite-900/60">
                {/* шапка станции */}
                <div className="border-b border-white/10 px-6 py-5 sm:px-8">
                  <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {station.name}
                  </h2>
                  <p className="mt-3 flex items-start gap-2.5 text-sm text-zinc-400">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                    {station.address}
                  </p>
                  <p className="mt-1.5 flex items-start gap-2.5 text-sm text-zinc-400">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                    {station.schedule}
                  </p>
                </div>

                {/* таблица цен */}
                <div className="flex-1">
                  {station.prices.map((p) => (
                    <div
                      key={p.fuel}
                      className="flex items-baseline justify-between border-b border-white/5 px-6 py-3.5 last:border-b-0 sm:px-8"
                    >
                      <span className="text-sm font-semibold tracking-wide text-zinc-200 sm:text-base">
                        {p.fuel}
                      </span>
                      <span className="font-display text-xl font-bold text-white tabular-nums sm:text-2xl">
                        {p.price}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-[10px] font-semibold tracking-[0.2em] text-zinc-600 uppercase sm:px-8">
                  <span>₽ за литр</span>
                  <span>Фаворит</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={220}>
          <p className="mt-7 text-sm text-zinc-500">
            Цены носят информационный характер. Актуальную стоимость уточняйте на АЗС.
          </p>
        </Reveal>
      </section>
    </>
  )
}

import { Clock, MapPin } from 'lucide-react'
import { gasStations, pricesUpdatedAt } from '../data/gasStations'
import { assets } from '../config/assets'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'

export function Stations() {
  const updatedLabel = new Date(pricesUpdatedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      <PageHeader
        image={assets.stations}
        kicker="Заправки"
        title="Наши АЗС"
        subtitle="Собственные автозаправочные станции. Актуальные цены на топливо — на цифровом табло ниже."
      />

      {/* ===== PREMIUM DIGITAL PRICE BOARD ===== */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:mt-24 sm:px-8">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500 uppercase">
            Цены на топливо
          </p>
        </Reveal>
        <SplitHeading className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Табло цен
        </SplitHeading>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {gasStations.map((station, i) => (
            <Reveal key={station.name} delay={i * 120} className="h-full">
              <div className="flex h-full flex-col border border-white/10 bg-graphite-900/80">
                {/* шапка табло */}
                <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8">
                  <div>
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
                  <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] whitespace-nowrap text-zinc-500 uppercase">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-500" />
                    Онлайн
                  </span>
                </div>

                {/* строки табло */}
                <div className="flex-1 px-6 sm:px-8">
                  {station.prices.map((p) => (
                    <div
                      key={p.fuel}
                      className="group flex items-baseline gap-4 border-b border-white/6 py-4 last:border-b-0"
                    >
                      <span className="font-display text-base font-semibold tracking-wide text-zinc-200 sm:text-lg">
                        {p.fuel}
                      </span>
                      <span className="flex-1 border-b border-dotted border-white/15" />
                      <span className="font-display text-2xl font-bold text-accent-400 tabular-nums transition-colors duration-300 group-hover:text-accent-500 sm:text-3xl">
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
          <p className="mt-2 text-xs text-zinc-600">Обновлено: {updatedLabel}</p>
        </Reveal>
      </section>
    </>
  )
}

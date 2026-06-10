import { Clock, Fuel, MapPin } from 'lucide-react'
import { gasStations } from '../data/gasStations'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { TiltCard } from '../components/ui/TiltCard'

export function Stations() {
  return (
    <>
      <PageHeader
        badge="Заправки"
        title="Наши"
        accent="АЗС"
        subtitle="Собственные автозаправочные станции. Актуальные цены — на цифровом табло ниже."
      />

      <section className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-7 lg:grid-cols-2 lg:gap-8">
          {gasStations.map((station, i) => (
            <Reveal key={station.name} delay={i * 120} className="h-full">
              <TiltCard max={4} className="h-full">
                {/* цифровое топливное табло */}
                <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-[#04070c] shadow-[0_32px_64px_-32px_rgb(0_0_0/0.85)]">
                  <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-accent-500/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-gas-500/8 blur-3xl" />

                  {/* шапка табло */}
                  <div className="relative flex items-center justify-between gap-4 border-b border-white/8 bg-white/[0.03] px-6 py-5 sm:px-8">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-flame-600 shadow-lg shadow-accent-500/30">
                        <Fuel className="h-6 w-6 text-white" />
                      </span>
                      <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                        {station.name}
                      </h2>
                    </div>
                    <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] text-zinc-500 uppercase">
                      <span className="h-2 w-2 rounded-full bg-amber-400 led-dot shadow-[0_0_10px_rgb(255_179_71/0.8)]" />
                      Табло цен
                    </span>
                  </div>

                  {/* адрес и режим */}
                  <div className="relative space-y-2 border-b border-white/8 px-6 py-4 sm:px-8">
                    <p className="flex items-start gap-2.5 text-sm text-zinc-400">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                      {station.address}
                    </p>
                    <p className="flex items-start gap-2.5 text-sm text-zinc-400">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                      {station.schedule}
                    </p>
                  </div>

                  {/* строки табло */}
                  <div className="bg-scanlines relative">
                    {station.prices.map((p) => (
                      <div
                        key={p.fuel}
                        className="flex items-center justify-between border-b border-white/5 px-6 py-3.5 transition-colors duration-300 last:border-b-0 hover:bg-white/[0.025] sm:px-8"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              p.fuel === 'СУГ' ? 'bg-gas-400' : 'bg-accent-400'
                            }`}
                          />
                          <span className="text-sm font-bold tracking-wide text-zinc-200 sm:text-base">
                            {p.fuel}
                          </span>
                        </span>
                        <span className="font-board led-amber text-2xl sm:text-3xl">
                          {p.price}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="relative flex items-center justify-between border-t border-white/8 bg-white/[0.02] px-6 py-3 text-[10px] font-semibold tracking-[0.2em] text-zinc-600 uppercase sm:px-8">
                    <span>₽ за литр</span>
                    <span>ФАВОРИТ</span>
                  </div>
                </div>
              </TiltCard>
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

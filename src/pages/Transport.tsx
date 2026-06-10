import { Route, ShieldCheck, Truck } from 'lucide-react'
import { ContactButtons } from '../components/ui/ContactButtons'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { TiltCard } from '../components/ui/TiltCard'
import { TankerScene } from '../components/scene/TankerScene'
import { RouteLines } from '../components/scene/RouteLines'

const features = [
  {
    icon: Truck,
    title: 'Перевозка топлива и СУГ',
    text: 'Специализированная транспортировка нефтепродуктов и сжиженного углеводородного газа.',
    iconBox: 'bg-gas-500/12 text-gas-400 border-gas-400/30',
    glow: 'bg-gas-500/12',
  },
  {
    icon: Route,
    title: 'Гибкие маршруты',
    text: 'Направления и графики перевозок согласовываются под задачи клиента.',
    iconBox: 'bg-accent-500/12 text-accent-400 border-accent-500/30',
    glow: 'bg-accent-500/12',
  },
  {
    icon: ShieldCheck,
    title: 'Безопасность',
    text: 'Соблюдение требований к перевозке опасных грузов на каждом этапе.',
    iconBox: 'bg-amber-400/12 text-amber-400 border-amber-400/30',
    glow: 'bg-amber-400/10',
  },
]

export function Transport() {
  return (
    <>
      <PageHeader
        badge="Транспорт"
        title="Перевозка топлива"
        accent="и СУГ"
        tone="gas"
        subtitle="Оказываем транспортные услуги по перевозке топлива и СУГ. Условия перевозки и маршруты согласовываются индивидуально."
      />

      {/* большая сцена: рентген-скан цистерны */}
      <section className="relative -mt-6 overflow-hidden sm:-mt-8">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(60%_90%_at_50%_100%,rgb(31_182_240/0.08),transparent_70%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
          <Reveal>
            <div className="flex w-full justify-center overflow-hidden">
              <TankerScene className="h-auto w-full min-w-[560px] sm:min-w-0" />
            </div>
          </Reveal>
          <Reveal delay={150}>
            <p className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3 text-center text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-gas-400/60" />
              Сканирование цистерны · СУГ
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-gas-400/60" />
            </p>
          </Reveal>
        </div>
      </section>

      {/* преимущества */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:mt-20 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 100} className="h-full">
              <TiltCard className="h-full">
                <div className="panel relative h-full overflow-hidden rounded-3xl p-7 sm:p-8">
                  <div
                    className={`pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full blur-3xl ${f.glow}`}
                  />
                  <span
                    className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border ${f.iconBox}`}
                  >
                    <f.icon className="h-7 w-7" />
                  </span>
                  <h2 className="font-display relative mt-5 text-lg font-bold text-white">
                    {f.title}
                  </h2>
                  <p className="relative mt-2.5 text-sm leading-relaxed text-zinc-400 sm:text-base">
                    {f.text}
                  </p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* движение маршрутов + CTA */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:mt-20 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-graphite-900/60 p-8 sm:p-12">
            <RouteLines tone="gas" className="pointer-events-none absolute inset-0 h-full w-full" />
            <div className="pointer-events-none absolute -top-24 right-[15%] h-64 w-64 rounded-full bg-gas-500/12 blur-3xl" />
            <div className="relative max-w-2xl">
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Нужна перевозка <span className="text-gradient-gas">топлива или СУГ?</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Согласуем маршрут, объём и условия — свяжитесь с нами удобным способом.
              </p>
              <div className="mt-7">
                <ContactButtons />
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}

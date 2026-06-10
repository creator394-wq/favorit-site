import { Droplets, Flame, Fuel, ShieldCheck, Truck } from 'lucide-react'
import { company } from '../../data/contacts'
import { ContactButtons } from '../ui/ContactButtons'
import { Reveal } from '../ui/Reveal'

const stats = [
  { value: `с ${company.sinceYear}`, label: 'года на рынке' },
  { value: '4', label: 'направления бизнеса' },
  { value: 'B2B / B2C', label: 'опт и розница' },
]

const orbitCards = [
  { icon: Flame, label: 'СУГ', sub: 'оптовые поставки', className: 'top-6 left-0 animate-float' },
  { icon: Droplets, label: 'Нефтепродукты', sub: 'для бизнеса', className: 'top-1/3 -right-2 animate-float-slow' },
  { icon: Fuel, label: 'АЗС', sub: 'актуальные цены', className: 'bottom-24 left-6 animate-float-slow' },
  { icon: Truck, label: 'Транспорт', sub: 'перевозка топлива', className: 'bottom-2 right-10 animate-float' },
]

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-36 pb-24 sm:pt-44 lg:pb-32">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_75%_60%_at_50%_35%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-flame-600/10 blur-[120px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <span className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em] text-zinc-300 uppercase">
              <ShieldCheck className="h-4 w-4 text-accent-400" />
              {company.name} · ИНН {company.inn}
            </span>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="font-display mt-7 text-[1.85rem] leading-[1.15] font-bold text-white sm:text-4xl lg:text-[2.9rem]">
              <span className="text-gradient-fire">СУГ, нефтепродукты</span>
              <br />
              и автозаправочные станции ООО «Фаворит»
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Оптовые поставки СУГ и нефтепродуктов, автозаправочные станции
              и транспортные услуги для бизнеса и частных клиентов.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <ContactButtons size="lg" className="mt-9" />
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-12 grid max-w-lg grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="border-l border-accent-500/40 pl-4">
                  <div className="font-display text-lg font-bold text-white sm:text-xl">
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 sm:text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={250} className="hidden lg:block">
          <div className="relative aspect-square">
            <div className="absolute inset-8 rounded-full border border-white/6" />
            <div className="absolute inset-20 rounded-full border border-white/8" />
            <div className="absolute inset-32 rounded-full border border-dashed border-accent-500/25" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="glow-accent animate-pulse-glow flex h-36 w-36 rotate-45 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-500 to-flame-600">
                <Flame className="h-14 w-14 -rotate-45 text-white" />
              </div>
            </div>

            {orbitCards.map(({ icon: Icon, label, sub, className }) => (
              <div
                key={label}
                className={`glass absolute flex items-center gap-3 rounded-2xl px-4 py-3 ${className}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15">
                  <Icon className="h-5 w-5 text-accent-400" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{label}</span>
                  <span className="block text-xs text-zinc-500">{sub}</span>
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

import { Building2, CheckCircle2, FileCheck } from 'lucide-react'
import { company } from '../../data/contacts'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

const activities = [
  'Оптовые поставки СУГ',
  'Нефтепродукты',
  'Автозаправочные станции',
  'Транспортные услуги',
]

export function About() {
  const years = new Date().getFullYear() - company.sinceYear

  return (
    <section id="about" className="relative py-24 lg:py-32">
      <div className="pointer-events-none absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-accent-500/7 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            badge="О компании"
            title="Надёжный партнёр в сфере топлива и энергоресурсов"
          />
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <div className="glass relative h-full overflow-hidden rounded-3xl p-8 lg:p-12">
              <div className="bg-diagonal pointer-events-none absolute inset-0 opacity-50" />
              <div className="relative">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-flame-600 shadow-lg shadow-accent-500/25">
                    <Building2 className="h-7 w-7 text-white" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-white">
                      {company.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                      <FileCheck className="h-4 w-4 text-accent-400" />
                      ИНН {company.inn}
                    </p>
                  </div>
                </div>

                <p className="mt-8 max-w-xl leading-relaxed text-zinc-400">
                  Компания работает в сфере реализации топлива и энергетических
                  ресурсов с {company.sinceYear} года. Мы выстраиваем долгосрочные
                  отношения с клиентами и партнёрами, обеспечивая стабильность
                  поставок и прозрачные условия сотрудничества.
                </p>

                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {activities.map((a) => (
                    <li key={a} className="flex items-center gap-3 text-zinc-200">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-400" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-6">
            <Reveal delay={120}>
              <div className="glass group relative overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:border-accent-500/30 lg:p-10">
                <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-accent-500/10 blur-3xl" />
                <div className="font-display text-5xl font-bold text-gradient-fire lg:text-6xl">
                  {years}+
                </div>
                <p className="mt-3 text-lg font-semibold text-white">лет на рынке</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Работаем с {company.sinceYear} года
                </p>
              </div>
            </Reveal>

            <Reveal delay={220}>
              <div className="glass rounded-3xl p-8 transition-all duration-500 hover:border-accent-500/30 lg:p-10">
                <div className="font-display text-5xl font-bold text-white lg:text-6xl">4</div>
                <p className="mt-3 text-lg font-semibold text-white">
                  направления деятельности
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  От оптовых поставок до розничной реализации топлива
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

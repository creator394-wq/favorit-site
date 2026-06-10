import { Building2, CheckCircle2, FileCheck } from 'lucide-react'
import { company } from '../data/contacts'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'

const activities = [
  'Оптовые поставки СУГ',
  'Оптовые поставки нефтепродуктов',
  'Автозаправочные станции',
  'Транспортные услуги',
]

export function About() {
  const years = new Date().getFullYear() - company.sinceYear

  return (
    <>
      <Reveal>
        <PageHeader
          badge="О компании"
          title="Надёжный партнёр в сфере топлива и энергоресурсов"
        />
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal className="h-full">
          <div className="glass relative h-full overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10">
            <div className="bg-diagonal pointer-events-none absolute inset-0 opacity-50" />
            <div className="relative">
              <div className="flex items-center gap-4">
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-flame-600 shadow-lg shadow-accent-500/25">
                  <Building2 className="h-6.5 w-6.5 text-white" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                    {company.name}
                  </h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                    <FileCheck className="h-4 w-4 text-accent-400" />
                    ИНН {company.inn}
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Компания работает в сфере реализации топлива и энергетических
                ресурсов с {company.sinceYear} года. Мы выстраиваем долгосрочные
                отношения с клиентами и партнёрами, обеспечивая стабильность
                поставок и прозрачные условия сотрудничества.
              </p>

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {activities.map((a) => (
                  <li key={a} className="flex items-center gap-3 text-sm text-zinc-200 sm:text-base">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-400" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-5">
          <Reveal delay={100}>
            <div className="glass relative overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:border-accent-500/30 sm:p-8">
              <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-accent-500/10 blur-3xl" />
              <div className="font-display text-gradient-fire text-4xl font-bold sm:text-5xl">
                {years}+
              </div>
              <p className="mt-2.5 text-base font-semibold text-white sm:text-lg">
                лет на рынке
              </p>
              <p className="mt-1.5 text-sm text-zinc-400">
                Работаем с {company.sinceYear} года
              </p>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="glass rounded-3xl p-6 transition-all duration-500 hover:border-accent-500/30 sm:p-8">
              <div className="font-display text-4xl font-bold text-white sm:text-5xl">4</div>
              <p className="mt-2.5 text-base font-semibold text-white sm:text-lg">
                направления деятельности
              </p>
              <p className="mt-1.5 text-sm text-zinc-400">
                От оптовых поставок до розничной реализации топлива
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </>
  )
}

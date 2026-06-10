import { Building2, FileCheck, Handshake, ShieldCheck, Zap } from 'lucide-react'
import { company } from '../data/contacts'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { TiltCard } from '../components/ui/TiltCard'

const timeline = [
  {
    label: String(company.sinceYear),
    title: 'Основание компании',
    text: 'Начало работы в сфере реализации топлива и энергетических ресурсов.',
    accent: true,
  },
  {
    label: 'Развитие',
    title: 'Оптовые поставки СУГ и нефтепродуктов',
    text: 'Выстраивание долгосрочных отношений с клиентами и партнёрами.',
  },
  {
    label: 'Развитие',
    title: 'Собственные автозаправочные станции',
    text: 'Розничная реализация топлива на собственных АЗС.',
  },
  {
    label: 'Развитие',
    title: 'Транспортные услуги',
    text: 'Перевозка топлива и СУГ по согласованным маршрутам.',
  },
  {
    label: 'Сегодня',
    title: '4 направления деятельности',
    text: 'Опт СУГ, опт нефтепродуктов, АЗС и транспортные услуги — одна система.',
    accent: true,
  },
]

const trust = [
  {
    icon: ShieldCheck,
    title: 'Стабильность поставок',
    text: 'Отлаженная логистика и проверенные источники.',
  },
  {
    icon: FileCheck,
    title: 'Прозрачные условия',
    text: 'Договор, документооборот и понятное ценообразование.',
  },
  {
    icon: Handshake,
    title: 'Прямой контакт',
    text: 'Все вопросы решаются напрямую с менеджером — без форм и посредников.',
  },
]

export function About() {
  const years = new Date().getFullYear() - company.sinceYear

  return (
    <>
      <PageHeader
        badge="О компании"
        title="Надёжный партнёр"
        accent="в топливе и энергоресурсах"
        subtitle={`${company.name} работает в сфере реализации топлива и энергетических ресурсов с ${company.sinceYear} года.`}
      />

      {/* визитка + ключевые цифры */}
      <section className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <div className="panel relative h-full overflow-hidden rounded-3xl p-7 sm:p-9">
              <div className="pointer-events-none absolute inset-0 bg-diagonal opacity-50" />
              <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-accent-500/12 blur-3xl" />
              <div className="relative flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-flame-600 shadow-lg shadow-accent-500/30">
                  <Building2 className="h-7 w-7 text-white" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                    {company.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">ИНН {company.inn}</p>
                </div>
              </div>
              <p className="relative mt-6 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Мы выстраиваем долгосрочные отношения с клиентами и партнёрами,
                обеспечивая стабильность поставок и прозрачные условия
                сотрудничества. Энергия, движение и надёжность — основа каждого
                направления нашей работы.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5">
            <Reveal delay={100}>
              <TiltCard>
                <div className="panel relative overflow-hidden rounded-3xl p-6 sm:p-7">
                  <Zap className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 text-accent-500/10" />
                  <div className="font-display text-gradient-fire text-4xl font-bold sm:text-5xl">
                    {years}+
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white sm:text-base">лет на рынке</p>
                  <p className="mt-1 text-xs text-zinc-500">Работаем с {company.sinceYear} года</p>
                </div>
              </TiltCard>
            </Reveal>
            <Reveal delay={180}>
              <TiltCard>
                <div className="panel relative overflow-hidden rounded-3xl p-6 sm:p-7">
                  <div className="font-display text-gradient-gas text-4xl font-bold sm:text-5xl">4</div>
                  <p className="mt-2 text-sm font-semibold text-white sm:text-base">
                    направления деятельности
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    От оптовых поставок до розничной реализации топлива
                  </p>
                </div>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* timeline развития */}
      <section className="mx-auto mt-20 w-full max-w-7xl px-5 sm:mt-24 sm:px-8">
        <Reveal>
          <span className="text-xs font-semibold tracking-[0.24em] text-zinc-500 uppercase">
            История
          </span>
          <h2 className="font-display mt-3 text-2xl font-bold text-white sm:text-4xl">
            Путь <span className="text-gradient-fire">компании</span>
          </h2>
        </Reveal>

        <div className="relative mt-12 ml-2 sm:ml-4">
          {/* рельса */}
          <div className="absolute top-2 bottom-2 left-[7px] w-0.5 bg-gradient-to-b from-accent-500/60 via-white/12 to-gas-400/50" />
          <div className="space-y-10">
            {timeline.map((t, i) => (
              <Reveal key={t.title} delay={i * 90}>
                <div className="relative pl-10 sm:pl-12">
                  <span
                    className={`absolute top-1 left-0 h-4 w-4 rounded-full border-2 ${
                      t.accent
                        ? 'border-accent-400 bg-accent-500/30 shadow-[0_0_14px_rgb(255_122_26/0.6)]'
                        : 'border-zinc-600 bg-graphite-900'
                    }`}
                  />
                  <span
                    className={`font-display text-xs font-bold tracking-[0.2em] uppercase ${
                      t.accent ? 'text-accent-400' : 'text-zinc-500'
                    }`}
                  >
                    {t.label}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-white sm:text-xl">{t.title}</h3>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-400">{t.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* блок доверия */}
      <section className="mx-auto mt-20 w-full max-w-7xl px-5 sm:mt-24 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {trust.map((t, i) => (
            <Reveal key={t.title} delay={i * 100} className="h-full">
              <TiltCard className="h-full">
                <div className="panel h-full rounded-3xl p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-500/30 bg-accent-500/12">
                    <t.icon className="h-6 w-6 text-accent-400" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-white sm:text-lg">{t.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t.text}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}

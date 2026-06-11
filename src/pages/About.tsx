import { FileCheck, Handshake, ShieldCheck } from 'lucide-react'
import { company } from '../data/contacts'
import { assets } from '../config/assets'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'

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
        image={assets.about}
        kicker="О компании"
        title="Надёжный партнёр в топливе и энергоресурсах"
        subtitle={`${company.name} работает в сфере реализации топлива и энергетических ресурсов с ${company.sinceYear} года.`}
      />

      {/* визитка + ключевые цифры */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:mt-20 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <div className="h-full border border-white/10 bg-graphite-900/60 p-7 sm:p-9">
              <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                {company.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">ИНН {company.inn}</p>
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Мы выстраиваем долгосрочные отношения с клиентами и партнёрами,
                обеспечивая стабильность поставок и прозрачные условия
                сотрудничества. Энергия, движение и надёжность — основа каждого
                направления нашей работы.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5">
            <Reveal delay={100}>
              <div className="border border-white/10 bg-graphite-900/60 p-6 sm:p-7">
                <div className="font-display text-4xl font-bold text-white sm:text-5xl">
                  {years}+
                </div>
                <p className="mt-2 text-sm font-semibold text-white sm:text-base">лет на рынке</p>
                <p className="mt-1 text-xs text-zinc-500">Работаем с {company.sinceYear} года</p>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <div className="border border-white/10 bg-graphite-900/60 p-6 sm:p-7">
                <div className="font-display text-4xl font-bold text-white sm:text-5xl">4</div>
                <p className="mt-2 text-sm font-semibold text-white sm:text-base">
                  направления деятельности
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  От оптовых поставок до розничной реализации топлива
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* timeline развития */}
      <section className="mx-auto mt-20 w-full max-w-7xl px-5 sm:mt-24 sm:px-8">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.28em] text-zinc-500 uppercase">
            История
          </p>
          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Путь компании
          </h2>
        </Reveal>

        <div className="relative mt-12 ml-2 sm:ml-4">
          {/* рельса */}
          <div className="absolute top-2 bottom-2 left-[5px] w-px bg-white/15" />
          <div className="space-y-10">
            {timeline.map((t, i) => (
              <Reveal key={t.title} delay={i * 90}>
                <div className="relative pl-10 sm:pl-12">
                  <span
                    className={`absolute top-1.5 left-0 h-[11px] w-[11px] rounded-full ${
                      t.accent ? 'bg-accent-500' : 'border border-zinc-600 bg-graphite-950'
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold tracking-[0.2em] uppercase ${
                      t.accent ? 'text-accent-400' : 'text-zinc-500'
                    }`}
                  >
                    {t.label}
                  </span>
                  <h3 className="font-display mt-2 text-lg font-semibold text-white sm:text-xl">
                    {t.title}
                  </h3>
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
              <div className="h-full border border-white/10 bg-graphite-900/60 p-7">
                <t.icon className="h-6 w-6 text-accent-400" />
                <h3 className="font-display mt-4 text-base font-semibold text-white sm:text-lg">
                  {t.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}

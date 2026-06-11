import { useRef } from 'react'
import { FileCheck, Handshake, ShieldCheck } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { company } from '../data/contacts'
import { assets } from '../config/assets'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'
import { Counter } from '../components/motion/Counter'
import { Tilt } from '../components/motion/Tilt'

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

const years = new Date().getFullYear() - company.sinceYear

export function About() {
  const rail = useRef<HTMLDivElement>(null)

  /* рельса таймлайна прорисовывается по мере скролла */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '[data-rail]',
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: 'top center',
          ease: 'none',
          scrollTrigger: {
            trigger: rail.current,
            start: 'top 75%',
            end: 'bottom 60%',
            scrub: true,
          },
        },
      )
    },
    { scope: rail },
  )

  return (
    <>
      <PageHeader
        image={assets.about}
        kicker="О компании"
        title="Масштаб, который работает на вас"
        subtitle={`${company.name} — оптовые поставки СУГ и нефтепродуктов, собственные АЗС и транспорт. На рынке с ${company.sinceYear} года.`}
      />

      {/* ===== STORYTELLING: большое утверждение + цифры ===== */}
      <section className="mx-auto mt-20 w-full max-w-7xl px-5 sm:mt-28 sm:px-8">
        <SplitHeading className="font-display max-w-4xl text-3xl leading-[1.12] font-bold tracking-tight text-white sm:text-5xl">
          Мы выстраиваем долгосрочные отношения, обеспечивая стабильность поставок
          и прозрачные условия сотрудничества.
        </SplitHeading>

        <div className="mt-16 grid grid-cols-2 gap-y-10 border-t border-white/10 pt-10 lg:grid-cols-4">
          <div>
            <div className="font-display text-5xl font-bold text-white sm:text-6xl">
              <Counter value={years} suffix="+" />
            </div>
            <p className="mt-2 text-sm text-zinc-400">лет на рынке</p>
          </div>
          <div className="lg:border-l lg:border-white/10 lg:pl-8">
            <div className="font-display text-5xl font-bold text-white sm:text-6xl">
              <Counter value={4} />
            </div>
            <p className="mt-2 text-sm text-zinc-400">направления деятельности</p>
          </div>
          <div className="lg:border-l lg:border-white/10 lg:pl-8">
            <div className="font-display text-5xl font-bold text-white sm:text-6xl">
              <Counter value={2} />
            </div>
            <p className="mt-2 text-sm text-zinc-400">собственные АЗС</p>
          </div>
          <div className="lg:border-l lg:border-white/10 lg:pl-8">
            <div className="font-display text-5xl font-bold text-white sm:text-6xl">
              <Counter value={100} suffix="%" />
            </div>
            <p className="mt-2 text-sm text-zinc-400">прямой контакт с менеджером</p>
          </div>
        </div>

        <Reveal delay={150}>
          <p className="mt-8 text-xs text-zinc-600">
            {company.name} · ИНН {company.inn}
          </p>
        </Reveal>
      </section>

      {/* ===== TIMELINE: прорисовка рельсы при скролле ===== */}
      <section className="mx-auto mt-24 w-full max-w-7xl px-5 sm:mt-32 sm:px-8">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500 uppercase">История</p>
        </Reveal>
        <SplitHeading className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Путь компании
        </SplitHeading>

        <div ref={rail} className="relative mt-14 ml-2 sm:ml-4">
          <div className="absolute top-2 bottom-2 left-[5px] w-px bg-white/10" />
          <div data-rail className="absolute top-2 bottom-2 left-[5px] w-px bg-accent-500" />
          <div className="space-y-12">
            {timeline.map((t, i) => (
              <Reveal key={t.title} delay={i * 80}>
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
                  <h3 className="font-display mt-2 text-lg font-semibold text-white sm:text-2xl">
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
      <section className="mx-auto mt-24 w-full max-w-7xl px-5 sm:mt-32 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {trust.map((t, i) => (
            <Reveal key={t.title} delay={i * 100} className="h-full">
              <Tilt className="h-full">
                <div className="group h-full border border-white/10 bg-graphite-900/60 p-7 transition-colors duration-500 hover:border-white/25">
                  <t.icon className="h-6 w-6 text-accent-400 transition-transform duration-500 group-hover:scale-110" />
                  <h3 className="font-display mt-4 text-base font-semibold text-white sm:text-lg">
                    {t.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t.text}</p>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}

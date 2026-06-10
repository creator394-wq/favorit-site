import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, ChevronDown, Fuel, Package, Truck } from 'lucide-react'
import { news, newsCategories, type NewsCategory } from '../data/news'
import { company, contacts } from '../data/contacts'
import { NewsCard } from '../components/NewsCard'
import { Reveal } from '../components/ui/Reveal'
import { TankerScene } from '../components/scene/TankerScene'
import { RouteLines } from '../components/scene/RouteLines'
import { FuelFlow } from '../components/scene/FuelFlow'

const directions = [
  {
    to: '/wholesale',
    icon: Package,
    title: 'Опт',
    text: 'СУГ и нефтепродукты оптовыми партиями для юридических лиц.',
    border: 'hover:border-accent-500/45',
    iconBox: 'bg-accent-500/14 text-accent-400 border-accent-500/30',
    tone: 'fire' as const,
    ambient: 'bg-[radial-gradient(60%_80%_at_20%_50%,rgb(255_122_26/0.13),transparent_70%)]',
  },
  {
    to: '/stations',
    icon: Fuel,
    title: 'Заправки',
    text: 'Собственные АЗС с актуальными ценами на топливо.',
    border: 'hover:border-amber-400/45',
    iconBox: 'bg-amber-400/12 text-amber-400 border-amber-400/30',
    tone: 'fire' as const,
    ambient: 'bg-[radial-gradient(60%_80%_at_50%_50%,rgb(255_179_71/0.12),transparent_70%)]',
  },
  {
    to: '/transport',
    icon: Truck,
    title: 'Транспорт',
    text: 'Перевозка топлива и СУГ по согласованным маршрутам.',
    border: 'hover:border-gas-400/45',
    iconBox: 'bg-gas-500/12 text-gas-400 border-gas-400/30',
    tone: 'gas' as const,
    ambient: 'bg-[radial-gradient(60%_80%_at_80%_50%,rgb(31_182_240/0.13),transparent_70%)]',
  },
]

type Filter = NewsCategory | 'Все'

export function Home() {
  const [filter, setFilter] = useState<Filter>('Все')
  const [active, setActive] = useState<number | null>(null)
  const filtered = filter === 'Все' ? news : news.filter((n) => n.category === filter)

  useEffect(() => {
    document.title = 'ООО «Фаворит» — топливо, СУГ и логистика'
  }, [])

  return (
    <>
      {/* ===== CINEMATIC HERO ===== */}
      <section className="relative flex min-h-svh flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-70 [mask-image:radial-gradient(75%_75%_at_50%_35%,black,transparent)]" />
        <RouteLines className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute -top-32 right-[8%] h-[420px] w-[420px] rounded-full bg-accent-500/14 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-gas-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-noise" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 pt-28 sm:px-8 sm:pt-32">
          <div className="max-w-3xl">
            <Reveal>
              <span className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[11px] font-semibold tracking-[0.24em] text-accent-400 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500 led-dot" />
                Топливно-логистическая компания · с {company.sinceYear} года
              </span>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="font-display mt-6 text-[2rem] leading-[1.1] font-bold text-white sm:text-5xl lg:text-[3.3rem]">
                ФАВОРИТ — <span className="text-gradient-fire animate-gradient-x">топливо, СУГ</span>{' '}
                и <span className="text-gradient-gas">логистика</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                Оптовые поставки СУГ и нефтепродуктов, автозаправочные станции и
                транспортные услуги для бизнеса.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-7 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  to="/wholesale"
                  className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-accent-600 to-flame-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-accent-500/30 transition-all duration-300 hover:shadow-accent-500/55 hover:-translate-y-0.5 sm:text-base"
                >
                  Опт
                  <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/stations"
                  className="glass inline-flex items-center gap-2.5 rounded-2xl px-7 py-4 text-sm font-bold text-white transition-all duration-300 hover:border-amber-400/40 hover:bg-amber-400/8 hover:-translate-y-0.5 sm:text-base"
                >
                  Заправки
                </Link>
                <Link
                  to="/contacts"
                  className="inline-flex items-center gap-2.5 rounded-2xl border border-white/12 px-7 py-4 text-sm font-bold text-zinc-300 transition-all duration-300 hover:border-gas-400/40 hover:text-white hover:-translate-y-0.5 sm:text-base"
                >
                  Контакты
                </Link>
              </div>
            </Reveal>
          </div>

          {/* сцена: цистерна с рентген-сканом */}
          <Reveal delay={300} className="mt-4 flex-1">
            <div className="relative -mb-2 flex w-full justify-center sm:-mb-4">
              <TankerScene className="h-auto max-h-[46svh] w-full min-w-[560px] max-w-5xl sm:min-w-0" />
            </div>
          </Reveal>
        </div>

        <a
          href="#directions"
          aria-label="Прокрутить вниз"
          className="relative mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-500 transition-colors duration-300 hover:border-accent-500/40 hover:text-white"
        >
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </section>

      {/* ===== INTERACTIVE DIRECTION SELECTOR ===== */}
      <section id="directions" className="relative scroll-mt-24 py-20 sm:py-24">
        {/* реагирующее на hover окружение */}
        {directions.map((d, i) => (
          <div
            key={d.to}
            className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${d.ambient} ${
              active === i ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="flex items-end justify-between gap-6">
              <div>
                <span className="text-xs font-semibold tracking-[0.24em] text-zinc-500 uppercase">
                  Направления
                </span>
                <h2 className="font-display mt-3 text-2xl font-bold text-white sm:text-4xl">
                  Три направления — <span className="text-gradient-fire">одна система</span>
                </h2>
              </div>
            </div>
          </Reveal>

          <div
            className="mt-10 flex flex-col gap-4 md:flex-row md:gap-5"
            onMouseLeave={() => setActive(null)}
          >
            {directions.map((d, i) => (
              <Reveal key={d.to} delay={i * 100} className="md:min-w-0 md:flex-1" >
                <Link
                  to={d.to}
                  onMouseEnter={() => setActive(i)}
                  style={{ flexGrow: active === i ? 1.45 : 1 }}
                  className={`group relative flex h-full min-h-[230px] flex-col justify-between overflow-hidden rounded-3xl border border-white/8 bg-graphite-900/60 p-7 transition-all duration-500 sm:min-h-[260px] sm:p-8 ${d.border}`}
                >
                  <RouteLines
                    tone={d.tone}
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                  />
                  <div className="relative flex items-start justify-between">
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:scale-110 ${d.iconBox}`}
                    >
                      <d.icon className="h-7 w-7" />
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-zinc-600 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white" />
                  </div>
                  <div className="relative">
                    <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                      {d.title}
                    </h3>
                    <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-zinc-400">
                      {d.text}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DYNAMIC FUEL FLOW ===== */}
      <section className="relative overflow-hidden py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-diagonal opacity-60" />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <span className="text-xs font-semibold tracking-[0.24em] text-zinc-500 uppercase">
              Схема работы
            </span>
            <h2 className="font-display mt-3 text-2xl font-bold text-white sm:text-4xl">
              Как движется <span className="text-gradient-gas">топливо</span>
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <div className="mt-12">
              <FuelFlow />
            </div>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-10 max-w-xl text-sm leading-relaxed text-zinc-500">
              Все этапы — от закупки до поставки клиенту — под контролем одной компании.
              Условия и объёмы согласовываются с менеджером:{' '}
              <a href={contacts.phoneHref} className="font-semibold text-accent-400 hover:text-accent-500">
                {contacts.phoneDisplay}
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== НОВОСТИ ===== */}
      <section className="relative py-20 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <span className="text-xs font-semibold tracking-[0.24em] text-zinc-500 uppercase">
              Информационный центр
            </span>
            <h2 className="font-display mt-3 text-2xl font-bold text-white sm:text-4xl">
              Новости и обновления
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-8 flex flex-wrap gap-2">
              {(['Все', ...newsCategories] as Filter[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    filter === cat
                      ? 'bg-gradient-to-r from-accent-600 to-flame-600 text-white shadow-lg shadow-accent-500/25'
                      : 'glass text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, i) => (
              <Reveal key={item.id} delay={Math.min(i, 5) * 70} className="h-full">
                <NewsCard item={item} />
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="mt-10 text-zinc-500">В этой категории пока нет новостей.</p>
          )}
        </div>
      </section>
    </>
  )
}

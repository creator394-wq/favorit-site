import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Fuel,
  Handshake,
  Package,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { news, newsCategories, type NewsCategory } from '../data/news'
import { company, contacts } from '../data/contacts'
import { NewsCard } from '../components/NewsCard'
import { Reveal } from '../components/ui/Reveal'
import { TankerScene } from '../components/scene/TankerScene'
import { RouteLines } from '../components/scene/RouteLines'
import { FuelFlow } from '../components/scene/FuelFlow'
import { DepotVignette, StationVignette, TruckVignette } from '../components/scene/Vignettes'

const directions = [
  {
    to: '/wholesale',
    icon: Package,
    vignette: DepotVignette,
    title: 'Оптовые поставки',
    text: 'СУГ и нефтепродукты оптовыми партиями для юридических лиц.',
    border: 'hover:border-accent-500/45',
    iconBox: 'bg-accent-500/14 text-accent-400 border-accent-500/30',
    ambient: 'bg-[radial-gradient(60%_80%_at_20%_50%,rgb(255_122_26/0.13),transparent_70%)]',
  },
  {
    to: '/stations',
    icon: Fuel,
    vignette: StationVignette,
    title: 'Автозаправочные станции',
    text: 'Собственные АЗС с актуальными ценами на топливо.',
    border: 'hover:border-amber-400/45',
    iconBox: 'bg-amber-400/12 text-amber-400 border-amber-400/30',
    ambient: 'bg-[radial-gradient(60%_80%_at_50%_50%,rgb(255_179_71/0.12),transparent_70%)]',
  },
  {
    to: '/transport',
    icon: Truck,
    vignette: TruckVignette,
    title: 'Транспортные услуги',
    text: 'Перевозка топлива и СУГ по согласованным маршрутам.',
    border: 'hover:border-gas-400/45',
    iconBox: 'bg-gas-500/12 text-gas-400 border-gas-400/30',
    ambient: 'bg-[radial-gradient(60%_80%_at_80%_50%,rgb(31_182_240/0.13),transparent_70%)]',
  },
]

const stats = [
  {
    icon: ShieldCheck,
    value: `${new Date().getFullYear() - company.sinceYear}+`,
    label: 'лет работы',
    sub: `с ${company.sinceYear} года`,
  },
  {
    icon: Boxes,
    value: '4',
    label: 'направления',
    sub: 'опт, АЗС, транспорт',
  },
  {
    icon: Fuel,
    value: 'СУГ',
    label: 'и нефтепродукты',
    sub: 'опт и розница',
  },
  {
    icon: Handshake,
    value: '100%',
    label: 'прямой контакт',
    sub: 'без посредников и форм',
  },
]

/** Декоративная HUD-панель телеметрии сканирования цистерны. */
function ScanHUD() {
  const [pct, setPct] = useState(93)

  useEffect(() => {
    const id = setInterval(() => setPct(89 + Math.floor(Math.random() * 9)), 2200)
    return () => clearInterval(id)
  }, [])

  const filled = Math.round((pct / 100) * 14)

  return (
    <div className="glass pointer-events-none absolute -top-4 right-0 z-10 hidden w-60 rounded-2xl p-4 xl:block">
      <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] text-zinc-400 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-gas-400 led-dot" />
        Сканирование цистерны
      </p>
      <p className="font-board mt-2 text-3xl text-gas-300 [text-shadow:0_0_14px_rgb(77_214_255/0.6)]">
        {pct}%
      </p>
      <div className="mt-2.5 flex gap-1">
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-[2px] transition-colors duration-500 ${
              i < filled ? 'bg-gas-400/90 shadow-[0_0_6px_rgb(77_214_255/0.7)]' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <p className="mt-2.5 text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
        Контроль герметичности · СУГ
      </p>
    </div>
  )
}

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
      {/* ===== CINEMATIC HERO: текст слева, большая сцена справа ===== */}
      <section className="relative flex min-h-svh flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(75%_75%_at_50%_35%,black,transparent)]" />
        <RouteLines className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />
        <div className="pointer-events-none absolute -top-32 right-[6%] h-[420px] w-[420px] rounded-full bg-accent-500/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-24 -left-32 h-96 w-96 rounded-full bg-gas-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-noise" />

        <div className="relative mx-auto grid w-full max-w-[88rem] flex-1 items-center gap-4 px-5 pt-28 pb-6 sm:px-8 lg:grid-cols-12 lg:gap-2 lg:pt-24 lg:pb-2">
          {/* левая колонка: контент */}
          <div className="max-w-xl lg:col-span-5">
            <Reveal>
              <span className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[11px] font-semibold tracking-[0.24em] text-accent-400 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500 led-dot" />
                Надёжные поставки топлива и СУГ
              </span>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="font-display mt-6 text-[2rem] leading-[1.08] font-bold text-white sm:text-5xl lg:text-[3.4rem]">
                ФАВОРИТ — <span className="text-gradient-fire animate-gradient-x">топливо, СУГ</span>{' '}
                и <span className="text-gradient-gas">логистика</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400 sm:text-lg">
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
                  Оптовые поставки
                  <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/stations"
                  className="glass inline-flex items-center gap-2.5 rounded-2xl px-7 py-4 text-sm font-bold text-white transition-all duration-300 hover:border-amber-400/40 hover:bg-amber-400/8 hover:-translate-y-0.5 sm:text-base"
                >
                  Заправки и цены
                </Link>
              </div>
            </Reveal>
          </div>

          {/* правая колонка: большая сцена с HUD, уходит за край кадра */}
          <Reveal delay={280} className="lg:col-span-7">
            <div className="relative lg:-mr-10 xl:-mr-20 2xl:-mr-28">
              <ScanHUD />
              <div className="flex w-full justify-center overflow-visible">
                <TankerScene className="h-auto w-full min-w-[640px] sm:min-w-0" />
              </div>
            </div>
          </Reveal>
        </div>

        {/* полоса фактов */}
        <div className="relative border-t border-white/8 bg-graphite-950/55 backdrop-blur-sm">
          <div className="mx-auto grid w-full max-w-[88rem] grid-cols-2 gap-y-6 px-5 py-6 sm:px-8 lg:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div
                  className={`flex items-center gap-4 ${i > 0 ? 'lg:border-l lg:border-white/8 lg:pl-8' : ''}`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-accent-400">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-display text-xl font-bold text-white sm:text-2xl">
                      {s.value}{' '}
                      <span className="text-sm font-semibold text-zinc-300 sm:text-base">
                        {s.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">{s.sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
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
              <Reveal key={d.to} delay={i * 100} className="md:min-w-0 md:flex-1">
                <Link
                  to={d.to}
                  onMouseEnter={() => setActive(i)}
                  style={{ flexGrow: active === i ? 1.45 : 1 }}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/8 bg-graphite-900/60 transition-all duration-500 ${d.border}`}
                >
                  {/* ночная виньетка */}
                  <div className="relative h-40 shrink-0 overflow-hidden sm:h-44">
                    <d.vignette className="h-full w-full transition-transform duration-700 group-hover:scale-[1.06]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-graphite-900/95 via-graphite-900/10 to-transparent" />
                    <ArrowUpRight className="absolute top-4 right-4 h-5 w-5 text-zinc-500 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white" />
                  </div>
                  <div className="relative flex flex-1 flex-col px-6 pt-1 pb-6 sm:px-7 sm:pb-7">
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-500 group-hover:scale-110 ${d.iconBox}`}
                      >
                        <d.icon className="h-5 w-5" />
                      </span>
                      <h3 className="font-display text-base leading-snug font-bold text-white sm:text-lg">
                        {d.title}
                      </h3>
                    </div>
                    <p className="mt-3.5 text-sm leading-relaxed text-zinc-400">{d.text}</p>
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

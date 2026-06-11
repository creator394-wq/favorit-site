import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { news, newsCategories, type NewsCategory } from '../data/news'
import { company, contacts } from '../data/contacts'
import { assets } from '../config/assets'
import { NewsCard } from '../components/NewsCard'
import { Reveal } from '../components/ui/Reveal'
import { ContactButtons } from '../components/ui/ContactButtons'

const directions = [
  {
    to: '/wholesale',
    image: assets.wholesale,
    title: 'Оптовые поставки',
    text: 'СУГ и нефтепродукты оптовыми партиями для юридических лиц.',
  },
  {
    to: '/stations',
    image: assets.stations,
    title: 'Автозаправочные станции',
    text: 'Собственные АЗС с актуальными ценами на топливо.',
  },
  {
    to: '/transport',
    image: assets.transport,
    title: 'Транспортные услуги',
    text: 'Перевозка топлива и СУГ по согласованным маршрутам.',
  },
]

const stats = [
  {
    value: `${new Date().getFullYear() - company.sinceYear}+`,
    label: 'лет работы',
    sub: `с ${company.sinceYear} года`,
  },
  { value: '4', label: 'направления', sub: 'опт, АЗС, транспорт' },
  { value: 'СУГ', label: 'и нефтепродукты', sub: 'опт и розница' },
  { value: '100%', label: 'прямой контакт', sub: 'без посредников и форм' },
]

const workflow = [
  { step: '01', title: 'Запрос', text: 'Вы описываете задачу: продукт, объём, сроки.' },
  { step: '02', title: 'Условия', text: 'Фиксируем цену, объём и график поставки.' },
  { step: '03', title: 'Логистика', text: 'Собственный транспорт под перевозку топлива и СУГ.' },
  { step: '04', title: 'Поставка', text: 'Доставка в срок и полный пакет документов.' },
]

type Filter = NewsCategory | 'Все'

export function Home() {
  const [filter, setFilter] = useState<Filter>('Все')
  const filtered = filter === 'Все' ? news : news.filter((n) => n.category === filter)

  useEffect(() => {
    document.title = 'ООО «Фаворит» — топливо, СУГ и логистика'
  }, [])

  return (
    <>
      {/* ===== HERO: полноэкранный slot-asset + типографика ===== */}
      <section className="relative flex min-h-svh flex-col">
        <img
          src={assets.hero.src}
          alt={assets.hero.alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* затемнение: лево под заголовок, низ под полосу фактов */}
        <div className="absolute inset-0 bg-gradient-to-r from-graphite-950/85 via-graphite-950/45 to-graphite-950/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-950 via-transparent to-graphite-950/35" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center px-5 pt-28 pb-10 sm:px-8">
          <div className="max-w-2xl">
            <Reveal>
              <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-accent-400 uppercase">
                <span className="h-px w-8 bg-accent-500" />
                Топливо · СУГ · Логистика
              </p>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="font-display mt-6 text-4xl leading-[1.04] font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Поставки СУГ
                <br />
                и нефтепродуктов
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
                Оптовые поставки для бизнеса, собственные АЗС и перевозка топлива —
                одна система под контролем компании с {company.sinceYear} года.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  to="/wholesale"
                  className="group inline-flex items-center gap-2.5 bg-accent-500 px-7 py-4 text-sm font-semibold text-graphite-950 transition-colors duration-300 hover:bg-accent-400 sm:text-base"
                >
                  Оптовые поставки
                  <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/stations"
                  className="inline-flex items-center gap-2.5 border border-white/25 px-7 py-4 text-sm font-semibold text-white transition-colors duration-300 hover:border-white/60 sm:text-base"
                >
                  Заправки и цены
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        {/* полоса фактов */}
        <div className="relative border-t border-white/10">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-y-6 px-5 py-7 sm:px-8 lg:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 70}>
                <div className={i > 0 ? 'lg:border-l lg:border-white/10 lg:pl-8' : ''}>
                  <div className="font-display text-2xl font-bold text-white">
                    {s.value}{' '}
                    <span className="text-sm font-medium text-zinc-300">{s.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{s.sub}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== НАПРАВЛЕНИЯ: фото-карточки ===== */}
      <section id="directions" className="scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              Направления
            </p>
            <h2 className="font-display mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Четыре направления — одна система
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {directions.map((d, i) => (
              <Reveal key={d.to} delay={i * 100} className="h-full">
                <Link
                  to={d.to}
                  className="group flex h-full flex-col border border-white/10 bg-graphite-900/60 transition-colors duration-300 hover:border-white/30"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={d.image.src}
                      alt={d.image.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/70 via-transparent to-transparent" />
                    <ArrowUpRight className="absolute top-4 right-4 h-5 w-5 text-white/70 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <h3 className="font-display text-lg leading-snug font-semibold text-white">
                      {d.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{d.text}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== КАК МЫ РАБОТАЕМ ===== */}
      <section className="border-y border-white/8 bg-graphite-900/40 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              Схема работы
            </p>
            <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Как проходит поставка
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((w, i) => (
              <Reveal key={w.step} delay={i * 90}>
                <div className="border-t border-white/15 pt-5">
                  <span className="font-display text-sm font-semibold text-accent-400">
                    {w.step}
                  </span>
                  <h3 className="font-display mt-3 text-lg font-semibold text-white">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{w.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <p className="mt-12 max-w-xl text-sm leading-relaxed text-zinc-500">
              Все этапы — от закупки до поставки клиенту — под контролем одной компании.
              Условия и объёмы согласовываются с менеджером:{' '}
              <a
                href={contacts.phoneHref}
                className="font-semibold text-accent-400 transition-colors hover:text-accent-500"
              >
                {contacts.phoneDisplay}
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== НОВОСТИ ===== */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              Информационный центр
            </p>
            <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
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
                  className={`border px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                    filter === cat
                      ? 'border-accent-500 bg-accent-500 text-graphite-950'
                      : 'border-white/15 text-zinc-400 hover:border-white/40 hover:text-white'
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

      {/* ===== КОНТАКТ-CTA ===== */}
      <section className="border-t border-white/8 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Обсудим поставку?
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
                  Прямой контакт с менеджером — без форм и посредников.
                </p>
              </div>
              <ContactButtons size="lg" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

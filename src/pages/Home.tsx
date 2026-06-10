import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Fuel, Package, PhoneCall, Truck } from 'lucide-react'
import { news, newsCategories, type NewsCategory } from '../data/news'
import { NewsCard } from '../components/NewsCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'

const quickLinks = [
  { to: '/wholesale', label: 'Оптовые поставки', icon: Package },
  { to: '/stations', label: 'Цены на АЗС', icon: Fuel },
  { to: '/transport', label: 'Перевозка топлива', icon: Truck },
  { to: '/contacts', label: 'Связаться с нами', icon: PhoneCall },
]

type Filter = NewsCategory | 'Все'

export function Home() {
  const [filter, setFilter] = useState<Filter>('Все')
  const filtered = filter === 'Все' ? news : news.filter((n) => n.category === filter)

  return (
    <>
      <Reveal>
        <PageHeader
          badge="Информационный центр"
          title="Новости и обновления"
          subtitle="Новости компании, изменения цен, объявления и события отрасли."
        />
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:gap-10">
        <div>
          <Reveal delay={100}>
            <div className="flex flex-wrap gap-2">
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

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {filtered.map((item, i) => (
              <Reveal key={item.id} delay={Math.min(i, 5) * 80} className="h-full">
                <NewsCard item={item} />
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="mt-10 text-zinc-500">В этой категории пока нет новостей.</p>
          )}
        </div>

        <aside className="space-y-5 lg:pt-12">
          <Reveal delay={150}>
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                Разделы
              </h2>
              <div className="mt-4 space-y-1.5">
                {quickLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:bg-white/5 hover:text-white"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/12">
                      <Icon className="h-4 w-4 text-accent-400" />
                    </span>
                    <span className="flex-1">{label}</span>
                    <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={250}>
            <div className="glass relative overflow-hidden rounded-2xl p-6">
              <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-accent-500/15 blur-2xl" />
              <h2 className="font-display text-lg font-bold text-white">
                Нужна консультация?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Менеджер ответит на вопросы по опту, ценам и перевозкам.
              </p>
              <Link
                to="/contacts"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-600 to-flame-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-all duration-300 hover:shadow-accent-500/45"
              >
                <PhoneCall className="h-4 w-4" />
                Контакты
              </Link>
            </div>
          </Reveal>
        </aside>
      </div>
    </>
  )
}

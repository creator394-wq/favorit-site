import { CalendarDays } from 'lucide-react'
import type { NewsItem, NewsCategory } from '../data/news'

const categoryStyles: Record<NewsCategory, string> = {
  Компания: 'bg-accent-500/15 text-accent-400 border-accent-500/25',
  АЗС: 'bg-amber-400/12 text-amber-400 border-amber-400/25',
  Опт: 'bg-sky-400/12 text-sky-400 border-sky-400/25',
  Рынок: 'bg-emerald-400/12 text-emerald-400 border-emerald-400/25',
  Транспорт: 'bg-violet-400/12 text-violet-400 border-violet-400/25',
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="group glass relative flex h-full flex-col overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:border-accent-500/30 sm:p-7">
      <div className="pointer-events-none absolute -top-14 -right-14 h-32 w-32 rounded-full bg-accent-500/0 blur-3xl transition-all duration-700 group-hover:bg-accent-500/12" />

      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide ${categoryStyles[item.category]}`}
        >
          {item.category}
        </span>
        <span className="flex items-center gap-1.5 text-xs whitespace-nowrap text-zinc-500">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(item.date)}
        </span>
      </div>

      <h3 className="mt-4 text-base leading-snug font-bold text-white transition-colors duration-300 group-hover:text-accent-400 sm:text-lg">
        {item.title}
      </h3>
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-zinc-400">
        {item.description}
      </p>
    </article>
  )
}

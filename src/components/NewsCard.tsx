import type { NewsItem } from '../data/news'

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="flex h-full flex-col border border-white/10 bg-graphite-900/60 p-6 transition-colors duration-300 hover:border-white/25 sm:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-[0.2em] text-accent-400 uppercase">
          {item.category}
        </span>
        <span className="text-xs whitespace-nowrap text-zinc-500">{formatDate(item.date)}</span>
      </div>

      <h3 className="font-display mt-4 text-base leading-snug font-semibold text-white sm:text-lg">
        {item.title}
      </h3>
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-zinc-400">{item.description}</p>
    </article>
  )
}

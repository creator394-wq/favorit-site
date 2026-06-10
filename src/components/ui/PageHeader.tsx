import { useEffect } from 'react'
import { RouteLines } from '../scene/RouteLines'

interface PageHeaderProps {
  badge: string
  title: string
  /** часть заголовка, выделяемая градиентом */
  accent?: string
  subtitle?: string
  tone?: 'fire' | 'gas'
}

/** Кинематографичная шапка внутренних страниц: маршруты, свечение, крупный заголовок. */
export function PageHeader({ badge, title, accent, subtitle, tone = 'fire' }: PageHeaderProps) {
  useEffect(() => {
    document.title = `${title}${accent ? ` ${accent}` : ''} — ООО «Фаворит»`
  }, [title, accent])

  return (
    <section className="relative overflow-hidden pt-36 pb-14 sm:pt-40 sm:pb-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(70%_70%_at_50%_30%,black,transparent)]" />
      <RouteLines className="pointer-events-none absolute inset-0 h-full w-full" tone={tone} opacity={0.7} />
      <div
        className={`pointer-events-none absolute -top-24 right-[12%] h-72 w-72 rounded-full blur-3xl ${
          tone === 'gas' ? 'bg-gas-500/14' : 'bg-accent-500/14'
        }`}
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold tracking-[0.24em] text-accent-400 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500 led-dot" />
          {badge}
        </span>
        <h1 className="font-display mt-6 max-w-4xl text-3xl leading-[1.12] font-bold text-white sm:text-5xl lg:text-6xl">
          {title}
          {accent && (
            <>
              {' '}
              <span className={tone === 'gas' ? 'text-gradient-gas' : 'text-gradient-fire'}>
                {accent}
              </span>
            </>
          )}
        </h1>
        {subtitle && (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}

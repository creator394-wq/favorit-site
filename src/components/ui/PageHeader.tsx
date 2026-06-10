import { useEffect } from 'react'

interface PageHeaderProps {
  badge: string
  title: string
  subtitle?: string
}

export function PageHeader({ badge, title, subtitle }: PageHeaderProps) {
  useEffect(() => {
    document.title = `${title} — ООО «Фаворит»`
  }, [title])

  return (
    <div className="mb-8 max-w-3xl sm:mb-10 lg:mb-12">
      <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-accent-400 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
        {badge}
      </span>
      <h1 className="font-display mt-5 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  )
}

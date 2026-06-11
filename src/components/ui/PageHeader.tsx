import { useEffect } from 'react'
import type { AssetSlot } from '../../config/assets'

interface PageHeaderProps {
  /** Слот-изображение раздела (см. src/config/assets.ts) */
  image: AssetSlot
  kicker: string
  title: string
  subtitle?: string
}

/**
 * Фото-хедер внутреннего раздела: полноширинное slot-изображение,
 * затемнение под текст, крупный заголовок. Замена файла слота —
 * единственное, что нужно для финального вида.
 */
export function PageHeader({ image, kicker, title, subtitle }: PageHeaderProps) {
  useEffect(() => {
    document.title = `${title} — ООО «Фаворит»`
  }, [title])

  return (
    <section className="relative flex min-h-[52svh] items-end overflow-hidden sm:min-h-[58svh]">
      <img
        src={image.src}
        alt={image.alt}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* затемнение: низ под текст, верх под шапку */}
      <div className="absolute inset-0 bg-gradient-to-t from-graphite-950 via-graphite-950/40 to-graphite-950/30" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-40 pb-12 sm:px-8 sm:pb-16">
        <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-accent-400 uppercase">
          <span className="h-px w-8 bg-accent-500" />
          {kicker}
        </p>
        <h1 className="font-display mt-5 max-w-4xl text-4xl leading-[1.05] font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}

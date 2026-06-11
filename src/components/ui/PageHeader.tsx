import { useEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../../lib/gsap'
import type { AssetSlot } from '../../config/assets'
import { SplitHeading } from '../motion/SplitHeading'

interface PageHeaderProps {
  image: AssetSlot
  kicker: string
  title: string
  subtitle?: string
}

/**
 * Кино-хедер раздела: slot-изображение с параллаксом и наездом камеры,
 * построчный reveal заголовка.
 */
export function PageHeader({ image, kicker, title, subtitle }: PageHeaderProps) {
  const root = useRef<HTMLElement>(null)
  const img = useRef<HTMLImageElement>(null)

  useEffect(() => {
    document.title = `${title} — ООО «Фаворит»`
  }, [title])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(img.current, { scale: 1.18 }, { scale: 1.04, duration: 1.8, ease: 'power3.out' })
      gsap.to(img.current, {
        yPercent: 16,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.from('[data-ph-fade]', {
        opacity: 0,
        y: 22,
        duration: 0.9,
        stagger: 0.1,
        delay: 0.45,
        ease: 'power3.out',
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative flex min-h-[62svh] items-end overflow-hidden sm:min-h-[70svh]">
      <img
        ref={img}
        src={image.src}
        alt={image.alt}
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-graphite-950 via-graphite-950/35 to-graphite-950/30" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-44 pb-14 sm:px-8 sm:pb-20">
        <p
          data-ph-fade
          className="flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-accent-400 uppercase"
        >
          <span className="h-px w-10 bg-accent-500" />
          {kicker}
        </p>
        <SplitHeading
          as="h1"
          onScroll={false}
          delay={0.3}
          className="font-display mt-6 max-w-4xl text-4xl leading-[1.02] font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          {title}
        </SplitHeading>
        {subtitle && (
          <p data-ph-fade className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}

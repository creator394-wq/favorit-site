import { useRef, type ElementType, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, SplitText, prefersReducedMotion } from '../../lib/gsap'

interface SplitHeadingProps {
  children: ReactNode
  as?: ElementType
  className?: string
  /** Задержка старта (сек) — для hero-последовательностей */
  delay?: number
  /** false → анимация сразу на mount (hero), true → при появлении в кадре */
  onScroll?: boolean
}

/**
 * Кинематографичная типографика: построчный mask-reveal (SplitText 3.13).
 */
export function SplitHeading({
  children,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  onScroll = true,
}: SplitHeadingProps) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      if (prefersReducedMotion()) return

      SplitText.create(ref.current, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 115,
            duration: 1.05,
            stagger: 0.09,
            delay,
            ease: 'power4.out',
            scrollTrigger: onScroll
              ? { trigger: ref.current, start: 'top 88%', once: true }
              : undefined,
          })
        },
      })
    },
    { scope: ref },
  )

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  )
}

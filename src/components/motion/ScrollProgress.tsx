import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../../lib/gsap'

/** Тонкая полоса прогресса скролла наверху экрана. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.to(bar.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
      })
    },
    { scope: bar },
  )

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px]">
      <div ref={bar} className="h-full w-full origin-left scale-x-0 bg-accent-500" />
    </div>
  )
}

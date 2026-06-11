import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/gsap'

/** Текущий экземпляр Lenis — для scrollTo при смене маршрута и пауз меню. */
export let lenis: Lenis | null = null

/**
 * Smooth scroll (Lenis) + синхронизация с ScrollTrigger.
 * Канонический паттерн: lenis.raf в gsap.ticker, lagSmoothing(0).
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion()) return

    lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis?.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis?.destroy()
      lenis = null
    }
  }, [])

  return children
}

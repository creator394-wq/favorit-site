import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'

/**
 * Кастомный курсор-точка (desktop, pointer: fine).
 * Растёт над интерактивными элементами; mix-blend-difference
 * даёт премиальную инверсию поверх любых фонов.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const el = dot.current!
    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' })

    const move = (e: MouseEvent) => {
      el.style.opacity = '1'
      xTo(e.clientX)
      yTo(e.clientY)
    }
    const isInteractive = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest('a, button, [data-cursor-hover]')
    const over = (e: MouseEvent) => {
      if (isInteractive(e.target)) gsap.to(el, { scale: 3.2, duration: 0.35, ease: 'power3.out' })
    }
    const out = (e: MouseEvent) => {
      if (isInteractive(e.target)) gsap.to(el, { scale: 1, duration: 0.35, ease: 'power3.out' })
    }
    const leave = () => {
      el.style.opacity = '0'
    }

    window.addEventListener('mousemove', move, { passive: true })
    document.addEventListener('mouseover', over)
    document.addEventListener('mouseout', out)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseover', over)
      document.removeEventListener('mouseout', out)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [])

  return (
    <div
      ref={dot}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[90] hidden h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 mix-blend-difference will-change-transform [@media(pointer:fine)]:block"
    />
  )
}

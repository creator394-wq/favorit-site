import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../../lib/gsap'

interface CounterProps {
  /** Конечное значение, например 11 */
  value: number
  /** Суффикс: "+", "%" */
  suffix?: string
  className?: string
}

/** Цифра, «набегающая» при появлении в кадре. */
export function Counter({ value, suffix = '', className = '' }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      if (prefersReducedMotion()) {
        el.textContent = `${value}${suffix}`
        return
      }
      const obj = { n: 0 }
      gsap.to(obj, {
        n: value,
        duration: 1.6,
        ease: 'power2.out',
        snap: { n: 1 },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => {
          el.textContent = `${Math.round(obj.n)}${suffix}`
        },
      })
    },
    { scope: ref },
  )

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      0{suffix}
    </span>
  )
}

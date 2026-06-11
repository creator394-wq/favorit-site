import { useRef, type ReactNode } from 'react'
import { gsap } from '../../lib/gsap'

interface MagneticProps {
  children: ReactNode
  className?: string
  /** Сила притяжения (px смещения на краю) */
  strength?: number
}

/** Магнитная кнопка: элемент тянется к курсору (только pointer: fine). */
export function Magnetic({ children, className = '', strength = 18 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el || !window.matchMedia('(pointer: fine)').matches) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2
    gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power3.out' })
  }

  const onLeave = () => {
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className || 'inline-block'}
    >
      {children}
    </div>
  )
}

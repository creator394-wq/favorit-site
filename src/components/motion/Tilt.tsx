import { useRef, type ReactNode } from 'react'
import { gsap } from '../../lib/gsap'

interface TiltProps {
  children: ReactNode
  className?: string
  /** Максимальный наклон, градусы */
  max?: number
}

/** Hover-depth: лёгкий 3D-наклон карточки за курсором (pointer: fine). */
export function Tilt({ children, className = '', max = 5 }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el || !window.matchMedia('(pointer: fine)').matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    gsap.to(el, {
      rotateY: x * max,
      rotateX: -y * max,
      transformPerspective: 900,
      duration: 0.5,
      ease: 'power3.out',
    })
  }

  const onLeave = () => {
    gsap.to(ref.current, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out' })
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`will-change-transform ${className}`}
    >
      {children}
    </div>
  )
}

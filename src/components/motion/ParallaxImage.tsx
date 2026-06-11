import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../../lib/gsap'

interface ParallaxImageProps {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  /** Глубина параллакса в % высоты (по умолчанию 12) */
  depth?: number
  loading?: 'eager' | 'lazy'
}

/**
 * Живое изображение: параллакс + лёгкий zoom при скролле (scrub).
 * Базовый строительный блок «изображения должны жить».
 */
export function ParallaxImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  depth = 12,
  loading = 'lazy',
}: ParallaxImageProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        img.current,
        { yPercent: -depth, scale: 1 + depth / 70 },
        {
          yPercent: depth,
          scale: 1 + depth / 100,
          ease: 'none',
          scrollTrigger: {
            trigger: wrap.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    },
    { scope: wrap },
  )

  return (
    <div ref={wrap} className={`overflow-hidden ${className}`}>
      <img
        ref={img}
        src={src}
        alt={alt}
        loading={loading}
        className={`h-full w-full object-cover will-change-transform ${imgClassName}`}
      />
    </div>
  )
}

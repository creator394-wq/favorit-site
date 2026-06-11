interface MarqueeProps {
  items: string[]
  className?: string
  /** Длительность одного прохода, сек */
  duration?: number
}

/** Бегущая типографическая лента — кинематографичный разделитель секций. */
export function Marquee({ items, className = '', duration = 28 }: MarqueeProps) {
  const row = (
    <div
      className="flex shrink-0 animate-[marquee_linear_infinite] items-center"
      style={{ animationDuration: `${duration}s` }}
      aria-hidden="true"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="font-display px-6 text-sm font-semibold tracking-[0.3em] text-zinc-500 uppercase sm:px-10">
            {item}
          </span>
          <span className="h-1 w-1 rounded-full bg-accent-500" />
        </span>
      ))}
    </div>
  )

  return (
    <div className={`flex overflow-hidden border-y border-white/8 py-5 ${className}`}>
      {row}
      {row}
    </div>
  )
}

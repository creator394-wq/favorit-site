interface SectionHeadingProps {
  badge: string
  title: string
  subtitle?: string
}

export function SectionHeading({ badge, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-14 max-w-3xl md:mb-20">
      <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-accent-400 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
        {badge}
      </span>
      <h2 className="font-display mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  )
}

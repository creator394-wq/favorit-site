interface RouteLinesProps {
  className?: string
  /** основной цвет линий: огонь (оранжевый) или газ (голубой) */
  tone?: 'fire' | 'gas' | 'mixed'
  opacity?: number
}

/**
 * Фоновая карта маршрутов: изогнутые пунктирные линии с движением
 * и пульсирующими узлами. Декоративный слой (aria-hidden).
 */
export function RouteLines({ className = '', tone = 'mixed', opacity = 1 }: RouteLinesProps) {
  const fire = '#ff9540'
  const gas = '#4dd6ff'
  const c1 = tone === 'gas' ? gas : fire
  const c2 = tone === 'fire' ? fire : gas

  return (
    <svg
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      <path
        d="M-60 500 C 220 430 380 250 620 270 S 1020 150 1260 100"
        stroke={c1}
        strokeOpacity="0.3"
        strokeWidth="1.6"
        strokeDasharray="12 16"
        fill="none"
        className="dash-flow"
      />
      <path
        d="M-60 200 C 240 240 470 430 720 410 S 1080 330 1260 380"
        stroke={c2}
        strokeOpacity="0.24"
        strokeWidth="1.6"
        strokeDasharray="10 18"
        fill="none"
        className="dash-flow-fast"
      />
      <path
        d="M-60 360 C 300 330 540 130 840 170 S 1140 260 1260 230"
        stroke="#ffffff"
        strokeOpacity="0.07"
        strokeWidth="1.4"
        strokeDasharray="6 14"
        fill="none"
        className="dash-flow"
      />
      {[
        [620, 270, c1],
        [340, 392, c2],
        [930, 178, c1],
        [770, 405, c2],
      ].map(([x, y, c]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="4" fill={c as string} fillOpacity="0.8" />
          <circle cx={x} cy={y} r="9" stroke={c as string} strokeOpacity="0.5" fill="none" className="ring-pulse" />
        </g>
      ))}
    </svg>
  )
}

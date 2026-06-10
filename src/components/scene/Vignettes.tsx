/**
 * Ночные индустриальные виньетки для карточек направлений.
 * Абстрактная геометрия + свет вместо фотографий (фото объектов запрещены).
 * Все id префиксованы (dv-/sv-/tv-) — три SVG живут на одной странице.
 */

type VignetteProps = { className?: string }

/* ---------- ОПТ: газгольдеры и резервуары ---------- */
export function DepotVignette({ className = '' }: VignetteProps) {
  return (
    <svg
      viewBox="0 0 400 180"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dv-bg" x1="0" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0b121c" />
          <stop offset="1" stopColor="#05070b" />
        </linearGradient>
        <radialGradient id="dv-sphere" cx="0.35" cy="0.3" r="0.95">
          <stop offset="0" stopColor="#42526a" />
          <stop offset="0.55" stopColor="#1a2230" />
          <stop offset="1" stopColor="#0a0f17" />
        </radialGradient>
        <linearGradient id="dv-tank" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0d1219" />
          <stop offset="0.4" stopColor="#222c3c" />
          <stop offset="1" stopColor="#0a0e15" />
        </linearGradient>
        <filter id="dv-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="dv-dot" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <rect width="400" height="180" fill="url(#dv-bg)" />
      <ellipse cx="140" cy="178" rx="170" ry="36" fill="#ff7a1a" opacity="0.13" filter="url(#dv-soft)" />
      <ellipse cx="330" cy="170" rx="90" ry="30" fill="#1fb6f0" opacity="0.08" filter="url(#dv-soft)" />

      {/* сферические газгольдеры */}
      {[
        [118, 122, 42],
        [208, 136, 30],
      ].map(([cx, cy, r]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r={r} fill="url(#dv-sphere)" stroke="#3a475c" strokeOpacity="0.5" strokeWidth="1.5" />
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.22} fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1.5" />
          {[-0.55, 0, 0.55].map((k) => (
            <line
              key={k}
              x1={cx + k * r}
              y1={cy + r * 0.8}
              x2={cx + k * r}
              y2={176}
              stroke="#1c2430"
              strokeWidth="5"
            />
          ))}
        </g>
      ))}
      {/* вертикальные резервуары */}
      <rect x="288" y="52" width="36" height="124" rx="5" fill="url(#dv-tank)" stroke="#2b3546" strokeOpacity="0.4" />
      <ellipse cx="306" cy="54" rx="18" ry="6" fill="#222c3c" stroke="#3a475c" strokeOpacity="0.5" />
      <rect x="334" y="84" width="26" height="92" rx="4" fill="url(#dv-tank)" />
      <ellipse cx="347" cy="86" rx="13" ry="4.5" fill="#1d2634" />
      {/* трубопровод */}
      <line x1="238" y1="148" x2="288" y2="148" stroke="#232b39" strokeWidth="4" />
      <line x1="262" y1="148" x2="262" y2="176" stroke="#232b39" strokeWidth="4" />
      {/* огни */}
      {[
        [118, 76, '#ff8c2e', 0],
        [306, 46, '#ff8c2e', 1.1],
        [208, 102, '#4dd6ff', 0.5],
        [347, 80, '#ffd9a8', 1.7],
      ].map(([cx, cy, c, b], i) => (
        <circle key={i} cx={Number(cx)} cy={Number(cy)} r="2.4" fill={String(c)} filter="url(#dv-dot)">
          <animate attributeName="opacity" values="0.3;0.95;0.3" dur="3.6s" begin={`${b}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  )
}

/* ---------- ЗАПРАВКИ: козырёк АЗС со светящейся полосой ---------- */
export function StationVignette({ className = '' }: VignetteProps) {
  return (
    <svg
      viewBox="0 0 400 180"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sv-bg" x1="0" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0b121c" />
          <stop offset="1" stopColor="#05070b" />
        </linearGradient>
        <linearGradient id="sv-fire" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="1" stopColor="#f0640a" />
        </linearGradient>
        <filter id="sv-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="sv-glow" x="-80%" y="-400%" width="260%" height="900%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="180" fill="url(#sv-bg)" />
      {/* тёплое пятно под станцией */}
      <ellipse cx="210" cy="172" rx="190" ry="34" fill="#ff7a1a" opacity="0.15" filter="url(#sv-soft)" />

      {/* стела с табло */}
      <rect x="34" y="62" width="32" height="106" rx="4" fill="#0d1117" stroke="#232b39" strokeWidth="1.5" />
      <rect x="40" y="70" width="20" height="14" rx="3" fill="url(#sv-fire)" opacity="0.9" />
      {[94, 112, 130].map((y, i) => (
        <rect key={y} x="40" y={y} width="20" height="6" rx="2" fill="#ffb347" opacity="0.75">
          <animate attributeName="opacity" values="0.45;0.95;0.45" dur="3s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
        </rect>
      ))}

      {/* козырёк */}
      <rect x="96" y="50" width="250" height="16" rx="4" fill="#10151d" stroke="#232b39" strokeWidth="1.5" />
      <rect x="96" y="64" width="250" height="4" rx="2" fill="url(#sv-fire)" filter="url(#sv-glow)">
        <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" repeatCount="indefinite" />
      </rect>
      {/* опоры */}
      <rect x="128" y="68" width="9" height="92" fill="#11161f" />
      <rect x="300" y="68" width="9" height="92" fill="#11161f" />
      {/* колонки */}
      {[170, 240].map((x, i) => (
        <g key={x}>
          <rect x={x} y="112" width="28" height="48" rx="4" fill="#141a24" stroke="#2a3340" strokeWidth="1.5" />
          <rect x={x + 5} y="118" width="18" height="10" rx="2" fill="#4dd6ff" opacity="0.55">
            <animate attributeName="opacity" values="0.35;0.8;0.35" dur="2.6s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
          </rect>
          <rect x={x + 5} y="132" width="18" height="3" rx="1.5" fill="#39434f" />
        </g>
      ))}
      {/* свет под козырьком */}
      {[150, 220, 290].map((x) => (
        <ellipse key={x} cx={x} cy="160" rx="34" ry="7" fill="#ffd9a8" opacity="0.08" filter="url(#sv-soft)" />
      ))}
      <line x1="0" y1="168" x2="400" y2="168" stroke="#fff" strokeOpacity="0.06" strokeWidth="2" />
    </svg>
  )
}

/* ---------- ТРАНСПОРТ: газовоз в движении ---------- */
export function TruckVignette({ className = '' }: VignetteProps) {
  return (
    <svg
      viewBox="0 0 400 180"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tv-bg" x1="0" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0b121c" />
          <stop offset="1" stopColor="#05070b" />
        </linearGradient>
        <linearGradient id="tv-shell" x1="0" y1="58" x2="0" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#334154" />
          <stop offset="0.5" stopColor="#10161f" />
          <stop offset="1" stopColor="#0a0e15" />
        </linearGradient>
        <linearGradient id="tv-gas" x1="0" y1="86" x2="0" y2="126" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4dd6ff" />
          <stop offset="1" stopColor="#0a6da0" />
        </linearGradient>
        <linearGradient id="tv-cab" x1="0" y1="62" x2="0" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2a3442" />
          <stop offset="0.5" stopColor="#0d121a" />
          <stop offset="1" stopColor="#080b10" />
        </linearGradient>
        <filter id="tv-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="tv-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="180" fill="url(#tv-bg)" />
      <ellipse cx="230" cy="150" rx="180" ry="34" fill="#1fb6f0" opacity="0.12" filter="url(#tv-soft)" />

      {/* цистерна */}
      <rect x="148" y="58" width="216" height="70" rx="35" fill="#060b13" />
      <rect x="156" y="88" width="200" height="34" rx="17" fill="url(#tv-gas)" opacity="0.65">
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="4s" repeatCount="indefinite" />
      </rect>
      <rect x="148" y="58" width="216" height="70" rx="35" fill="url(#tv-shell)" opacity="0.55" />
      <rect x="148" y="58" width="216" height="70" rx="35" stroke="#9fb3cc" strokeOpacity="0.25" strokeWidth="1.5" />
      <rect x="166" y="63" width="180" height="5" rx="2.5" fill="#fff" opacity="0.07" />

      {/* кабина (едет влево) */}
      <path d="M86 130 L86 84 Q86 76 90 70 L96 60 Q99 54 108 54 L140 54 Q148 54 148 62 L148 130 Z" fill="url(#tv-cab)" />
      <path d="M90 70 L96 60 Q99 54 108 54" stroke="#ff9540" strokeWidth="1.8" opacity="0.8" filter="url(#tv-glow)" />
      <rect x="112" y="64" width="28" height="26" rx="4" fill="#0d1f30" />
      {/* фара */}
      <rect x="84" y="104" width="6" height="10" rx="3" fill="#dff3ff" filter="url(#tv-glow)" />
      <path d="M84 105 L18 96 L18 122 L84 113 Z" fill="#dff3ff" opacity="0.1" />

      {/* колёса */}
      {[112, 196, 252, 308].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="132" r="15" fill="#07090d" stroke="#1d242e" strokeWidth="3" />
          <circle cx={cx} cy="132" r="7" fill="#222a36" stroke="#39434f" strokeWidth="1.5" />
        </g>
      ))}

      {/* дорога */}
      <line x1="0" y1="148" x2="400" y2="148" stroke="#fff" strokeOpacity="0.08" strokeWidth="2" />
      <line
        x1="0"
        y1="158"
        x2="400"
        y2="158"
        stroke="#ff9540"
        strokeOpacity="0.3"
        strokeWidth="2"
        strokeDasharray="20 28"
        className="road-flow"
      />
      {/* линии скорости */}
      {[
        [330, 74, 40],
        [348, 100, 30],
      ].map(([x, y, w]) => (
        <line key={y} x1={x} y1={y} x2={x + w} y2={y} stroke="#4dd6ff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="opacity" values="0;0.8;0" dur="1.4s" begin={`${(y % 5) / 4}s`} repeatCount="indefinite" />
        </line>
      ))}
    </svg>
  )
}

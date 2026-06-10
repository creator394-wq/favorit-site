/**
 * Кинематографичная SVG-сцена: автоцистерна с эффектом рентген-скана.
 * Сканирующий луч проходит по цистерне и «просвечивает» голубой газ внутри
 * (волны + пузырьки энергии). Анимации — SMIL, без WebGL: быстро и стабильно
 * на любом устройстве.
 */
export function TankerScene({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 920 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Автоцистерна для перевозки СУГ со сканирующим лучом"
    >
      <defs>
        {/* металл цистерны */}
        <linearGradient id="shellGrad" x1="0" y1="120" x2="0" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3a4556" />
          <stop offset="0.28" stopColor="#1b222d" />
          <stop offset="0.62" stopColor="#0e131b" />
          <stop offset="1" stopColor="#202835" />
        </linearGradient>
        {/* газ */}
        <linearGradient id="gasGrad" x1="0" y1="186" x2="0" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8ee9ff" />
          <stop offset="0.35" stopColor="#1fb6f0" />
          <stop offset="1" stopColor="#085a86" />
        </linearGradient>
        {/* кабина */}
        <linearGradient id="cabGrad" x1="618" y1="140" x2="618" y2="296" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff9540" />
          <stop offset="0.5" stopColor="#f0640a" />
          <stop offset="1" stopColor="#9c3408" />
        </linearGradient>
        <linearGradient id="winGrad" x1="700" y1="140" x2="780" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9adcff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#10293c" stopOpacity="0.95" />
        </linearGradient>
        {/* окно сканера (для маски) */}
        <linearGradient id="scanWindow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="tankClip">
          <rect x="74" y="132" width="512" height="136" rx="68" />
        </clipPath>
        <mask id="tankScan" maskUnits="userSpaceOnUse" x="60" y="90" width="560" height="220">
          <rect x="60" y="90" width="560" height="220" fill="black" />
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 362 0; 0 0"
              dur="7.5s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            />
            <rect x="74" y="90" width="150" height="220" fill="url(#scanWindow)" />
          </g>
        </mask>
        <filter id="beamGlow" x="-300%" y="-30%" width="700%" height="160%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>

        {/* тело газа: волны + пузырьки (переиспользуется в двух слоях) */}
        <g id="gasBody">
          <rect x="74" y="206" width="512" height="62" fill="url(#gasGrad)" />
          <path
            d="M-260 196 q55 -16 110 0 t110 0 t110 0 t110 0 t110 0 t110 0 t110 0 t110 0 L860 270 L-260 270 Z"
            fill="url(#gasGrad)"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; -220 0"
              dur="5.2s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M-260 204 q55 -10 110 0 t110 0 t110 0 t110 0 t110 0 t110 0 t110 0 t110 0 L860 270 L-260 270 Z"
            fill="#4dd6ff"
            opacity="0.4"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="-220 0; 0 0"
              dur="8.5s"
              repeatCount="indefinite"
            />
          </path>
          {/* пузырьки энергии */}
          {[
            [130, 0],
            [195, 1.1],
            [268, 0.5],
            [330, 1.7],
            [398, 0.2],
            [462, 1.4],
            [528, 0.8],
          ].map(([cx, delay]) => (
            <circle key={cx} cx={cx} cy="258" r="3" fill="#bdf1ff">
              <animate
                attributeName="cy"
                values="260;156"
                dur="3.8s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.95;0"
                dur="3.8s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      </defs>

      {/* подсветка сцены */}
      <ellipse cx="330" cy="300" rx="300" ry="60" fill="#1fb6f0" opacity="0.1" filter="url(#softBlur)" />
      <ellipse cx="730" cy="260" rx="180" ry="70" fill="#ff7a1a" opacity="0.12" filter="url(#softBlur)" />

      {/* тень */}
      <ellipse cx="440" cy="350" rx="350" ry="13" fill="#000" opacity="0.55" filter="url(#softBlur)" />

      {/* ===== полуприцеп-цистерна ===== */}
      {/* интерьер (рентген-окно) */}
      <rect x="74" y="132" width="512" height="136" rx="68" fill="#060b13" />
      {/* газ: всегда едва виден */}
      <g clipPath="url(#tankClip)" opacity="0.2">
        <use href="#gasBody" />
      </g>
      {/* газ: ярко — только в окне сканера */}
      <g clipPath="url(#tankClip)" mask="url(#tankScan)">
        <use href="#gasBody" />
      </g>
      {/* полупрозрачная металлическая оболочка поверх */}
      <rect x="60" y="120" width="540" height="160" rx="80" fill="url(#shellGrad)" opacity="0.4" />
      <rect x="60" y="120" width="540" height="160" rx="80" stroke="#9fb3cc" strokeOpacity="0.28" strokeWidth="2" />
      {/* блик и сварные швы */}
      <rect x="92" y="131" width="476" height="9" rx="4.5" fill="#fff" opacity="0.08" />
      <line x1="205" y1="124" x2="205" y2="276" stroke="#fff" strokeOpacity="0.06" strokeWidth="2" />
      <line x1="330" y1="121" x2="330" y2="279" stroke="#fff" strokeOpacity="0.06" strokeWidth="2" />
      <line x1="455" y1="124" x2="455" y2="276" stroke="#fff" strokeOpacity="0.06" strokeWidth="2" />
      {/* люки */}
      <rect x="238" y="108" width="36" height="15" rx="5" fill="#1c242f" stroke="#9fb3cc" strokeOpacity="0.25" />
      <rect x="352" y="108" width="36" height="15" rx="5" fill="#1c242f" stroke="#9fb3cc" strokeOpacity="0.25" />
      {/* маркировка */}
      <text
        x="330"
        y="248"
        textAnchor="middle"
        fontFamily="Unbounded, sans-serif"
        fontSize="17"
        letterSpacing="10"
        fill="#fff"
        opacity="0.16"
      >
        СУГ • LPG
      </text>

      {/* шасси */}
      <rect x="86" y="282" width="520" height="12" rx="4" fill="#10151d" stroke="#2a3340" />
      <rect x="118" y="294" width="14" height="26" rx="3" fill="#1a212c" />

      {/* ===== тягач ===== */}
      <rect x="600" y="248" width="24" height="12" rx="3" fill="#1a212c" />
      <rect x="626" y="128" width="9" height="86" rx="4" fill="#2a3340" />
      <rect x="618" y="212" width="178" height="80" rx="10" fill="url(#cabGrad)" />
      <path
        d="M640 216 V158 Q640 142 658 140 L742 134 Q762 133 771 150 L793 198 L797 216 Z"
        fill="url(#cabGrad)"
      />
      <path d="M712 146 L745 143 Q756 143 760 153 L773 185 L716 185 Z" fill="url(#winGrad)" />
      <rect x="793" y="238" width="13" height="52" rx="4" fill="#10151d" stroke="#2a3340" />
      <circle cx="799" cy="250" r="4" fill="#ffd9a8">
        <animate attributeName="opacity" values="1;0.55;1" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* свет фары */}
      <path d="M804 244 L904 230 L904 268 L804 258 Z" fill="#ffb347" opacity="0.1" filter="url(#softBlur)" />
      <text x="668" y="266" fontFamily="Unbounded, sans-serif" fontSize="11" letterSpacing="2" fill="#fff" opacity="0.6">
        ФАВОРИТ
      </text>

      {/* ===== колёса ===== */}
      {[430, 492, 554, 652, 752].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="316" r="26" fill="#0a0e14" stroke="#39434f" strokeWidth="3" />
          <circle cx={cx} cy="316" r="10" fill="#1c242f" stroke="#4a5563" strokeWidth="2" />
          <circle cx={cx} cy="316" r="3" fill="#5a6675" />
        </g>
      ))}

      {/* ===== дорога ===== */}
      <line x1="0" y1="346" x2="920" y2="346" stroke="#fff" strokeOpacity="0.1" strokeWidth="2" />
      <line
        x1="0"
        y1="347"
        x2="920"
        y2="347"
        stroke="#ff9540"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeDasharray="34 62"
        className="road-flow"
      />
      {/* линии скорости позади */}
      {[
        [10, 200, 70],
        [0, 236, 52],
        [18, 168, 46],
      ].map(([x, y, w]) => (
        <line key={y} x1={x} y1={y} x2={x + w} y2={y} stroke="#4dd6ff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="opacity" values="0;0.8;0" dur="1.6s" begin={`${y % 7 / 5}s`} repeatCount="indefinite" />
        </line>
      ))}

      {/* ===== сканирующий луч ===== */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 362 0; 0 0"
          dur="7.5s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
        />
        <line x1="149" y1="92" x2="149" y2="308" stroke="#bdf1ff" strokeWidth="2.5" filter="url(#beamGlow)" />
        <line x1="149" y1="92" x2="149" y2="308" stroke="#4dd6ff" strokeWidth="9" opacity="0.18" />
        <circle cx="149" cy="92" r="4.5" fill="#dffaff" filter="url(#beamGlow)" />
        <circle cx="149" cy="308" r="4.5" fill="#dffaff" filter="url(#beamGlow)" />
      </g>
    </svg>
  )
}

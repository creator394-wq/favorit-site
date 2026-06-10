/**
 * Кинематографичная SVG-сцена уровня «постер»: седельный тягач с цистерной СУГ
 * ночью на мокрой дороге, на фоне огней нефтеперерабатывающего комплекса.
 *
 * Свет как материал: фара с конусом, rim-light на кабине, боке-огни НПЗ,
 * отражение всей сцены в мокром асфальте. Рентген-скан: луч проходит по
 * цистерне и «просвечивает» голубой газ (волны + пузырьки энергии).
 * Колёса вращаются, разметка бежит. Всё — SVG/SMIL, без WebGL.
 */

const WHEELS = [198, 372, 876, 962, 1048]

export function TankerScene({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1280 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Автоцистерна для перевозки СУГ ночью со сканирующим лучом"
    >
      <defs>
        {/* небо и дымка */}
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="470" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#05070b" />
          <stop offset="0.55" stopColor="#0a111b" />
          <stop offset="1" stopColor="#0d1018" />
        </linearGradient>
        <linearGradient id="hazeGrad" x1="0" y1="300" x2="0" y2="470" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06080c" stopOpacity="0" />
          <stop offset="1" stopColor="#06080c" stopOpacity="0.85" />
        </linearGradient>
        {/* дорога */}
        <linearGradient id="roadGrad" x1="0" y1="470" x2="0" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c0f15" />
          <stop offset="1" stopColor="#04060a" />
        </linearGradient>
        {/* металл цистерны: спекуляр сверху, тёплый рефлекс снизу */}
        <linearGradient id="shellGrad" x1="0" y1="176" x2="0" y2="392" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2e3a4b" />
          <stop offset="0.07" stopColor="#55687f" />
          <stop offset="0.17" stopColor="#1b2430" />
          <stop offset="0.34" stopColor="#0e141d" />
          <stop offset="0.46" stopColor="#2b3a4e" />
          <stop offset="0.52" stopColor="#46586e" />
          <stop offset="0.6" stopColor="#192231" />
          <stop offset="0.82" stopColor="#0a0f16" />
          <stop offset="0.94" stopColor="#241712" />
          <stop offset="1" stopColor="#120b08" />
        </linearGradient>
        {/* затемнение торцов цистерны (объём цилиндра по горизонтали) */}
        <linearGradient id="shellEnds" x1="372" y1="0" x2="1140" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="0.07" stopColor="#000" stopOpacity="0" />
          <stop offset="0.86" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
        {/* газ */}
        <linearGradient id="gasGrad" x1="0" y1="280" x2="0" y2="384" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8ee9ff" />
          <stop offset="0.35" stopColor="#1fb6f0" />
          <stop offset="1" stopColor="#07527c" />
        </linearGradient>
        {/* кабина: чёрный глянец */}
        <linearGradient id="cabGrad" x1="0" y1="126" x2="0" y2="438" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3d4756" />
          <stop offset="0.1" stopColor="#222b38" />
          <stop offset="0.32" stopColor="#10161f" />
          <stop offset="0.62" stopColor="#090d14" />
          <stop offset="0.88" stopColor="#06080d" />
          <stop offset="1" stopColor="#181210" />
        </linearGradient>
        <linearGradient id="winGrad" x1="220" y1="140" x2="335" y2="225" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7fb6d8" stopOpacity="0.85" />
          <stop offset="0.4" stopColor="#1c3247" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0a1622" stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id="rimGrad" x1="0" y1="126" x2="0" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="1" stopColor="#f0640a" />
        </linearGradient>
        <linearGradient id="fireGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="1" stopColor="#f0640a" />
        </linearGradient>
        <radialGradient id="rimWheel" cx="0.38" cy="0.34" r="0.85">
          <stop offset="0" stopColor="#55626f" />
          <stop offset="0.5" stopColor="#222a36" />
          <stop offset="1" stopColor="#0f141c" />
        </radialGradient>
        <linearGradient id="coneGrad" x1="140" y1="0" x2="-60" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#dff3ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#dff3ff" stopOpacity="0" />
        </linearGradient>
        {/* окно сканера (для маски) */}
        <linearGradient id="scanWindow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="reflGrad" x1="0" y1="470" x2="0" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>

        <clipPath id="tankClip">
          <rect x="384" y="188" width="744" height="192" rx="96" />
        </clipPath>
        <mask id="tankScan" maskUnits="userSpaceOnUse" x="340" y="140" width="820" height="300">
          <rect x="340" y="140" width="820" height="300" fill="black" />
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 554 0; 0 0"
              dur="9s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            />
            <rect x="384" y="140" width="190" height="300" fill="url(#scanWindow)" />
          </g>
        </mask>
        <mask id="reflFade" maskUnits="userSpaceOnUse" x="0" y="470" width="1280" height="90">
          <rect x="0" y="470" width="1280" height="90" fill="url(#reflGrad)" />
        </mask>

        <filter id="beamGlow" x="-300%" y="-30%" width="700%" height="160%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glowSm" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="bokehBlur" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="reflBlur" x="-5%" y="-30%" width="110%" height="160%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>

        {/* тело газа: волны + пузырьки (переиспользуется в двух слоях) */}
        <g id="gasBody">
          <rect x="384" y="306" width="744" height="78" fill="url(#gasGrad)" />
          <path
            d="M-300 302 q60 -16 120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 L1500 392 L-300 392 Z"
            fill="url(#gasGrad)"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; -240 0"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M-300 314 q60 -10 120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 L1500 392 L-300 392 Z"
            fill="#4dd6ff"
            opacity="0.38"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="-240 0; 0 0"
              dur="9.5s"
              repeatCount="indefinite"
            />
          </path>
          {[
            [432, 0],
            [524, 1.2],
            [612, 0.5],
            [704, 1.8],
            [792, 0.2],
            [884, 1.5],
            [972, 0.8],
            [1062, 2.1],
          ].map(([cx, delay]) => (
            <circle key={cx} cx={cx} cy="368" r="3.2" fill="#bdf1ff">
              <animate
                attributeName="cy"
                values="372;250"
                dur="4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.95;0"
                dur="4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      </defs>

      {/* ======================= СРЕДА ======================= */}
      <rect width="1280" height="470" fill="url(#skyGrad)" />

      {/* дальний план: силуэты НПЗ */}
      <g fill="#0d1520" opacity="0.65">
        <rect x="30" y="196" width="22" height="274" />
        <rect x="22" y="188" width="38" height="10" rx="3" />
        <rect x="64" y="252" width="14" height="218" />
        <rect x="86" y="300" width="30" height="170" rx="4" />
        <circle cx="142" cy="438" r="34" />
        <rect x="120" y="436" width="44" height="34" />
        <rect x="612" y="118" width="16" height="80" />
        <rect x="604" y="110" width="32" height="9" rx="3" />
        <rect x="652" y="142" width="11" height="50" />
        <rect x="690" y="128" width="8" height="60" />
        <rect x="1168" y="184" width="24" height="286" />
        <rect x="1160" y="174" width="40" height="11" rx="3" />
        <rect x="1212" y="238" width="15" height="232" />
        <circle cx="1252" cy="442" r="30" />
        <rect x="1230" y="440" width="50" height="30" />
        <rect x="1146" y="320" width="134" height="4" />
        <rect x="0" y="356" width="120" height="4" />
      </g>
      {/* ближний план силуэтов */}
      <g fill="#080d14" opacity="0.9">
        <rect x="0" y="386" width="100" height="84" />
        <rect x="1196" y="396" width="84" height="74" />
      </g>

      {/* факел на колонне */}
      <circle cx="620" cy="104" r="5" fill="#ffb347" filter="url(#bokehBlur)">
        <animate attributeName="opacity" values="0.5;1;0.6;0.9;0.5" dur="2.6s" repeatCount="indefinite" />
        <animate attributeName="r" values="4;6;4.5;5.5;4" dur="2.6s" repeatCount="indefinite" />
      </circle>

      {/* боке-огни комплекса */}
      {[
        [70, 230, 3.5, '#ff8c2e', 0, 5.5],
        [108, 296, 2.6, '#ffd9a8', 1.2, 4.2],
        [150, 368, 4.2, '#ff7a1a', 0.6, 6.5],
        [240, 408, 3, '#4dd6ff', 2.1, 5],
        [330, 432, 2.4, '#ffd9a8', 0.9, 4.6],
        [660, 168, 2.6, '#ff8c2e', 1.6, 5.2],
        [700, 196, 2.2, '#ffd9a8', 0.3, 4],
        [1120, 300, 3.4, '#ffd9a8', 1.9, 6],
        [1185, 226, 3, '#ff8c2e', 0.4, 4.8],
        [1232, 330, 4, '#ff7a1a', 1.1, 5.8],
        [1262, 396, 2.6, '#4dd6ff', 2.4, 4.4],
        [1090, 416, 3.2, '#ffd9a8', 0.7, 5.4],
      ].map(([cx, cy, r, color, begin, dur], i) => (
        <circle key={i} cx={Number(cx)} cy={Number(cy)} r={Number(r)} fill={String(color)} filter="url(#bokehBlur)" opacity="0.5">
          <animate
            attributeName="opacity"
            values="0.25;0.75;0.25"
            dur={`${dur}s`}
            begin={`${begin}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* атмосферная дымка прижимает фон к земле */}
      <rect x="0" y="300" width="1280" height="170" fill="url(#hazeGrad)" />

      {/* ======================= ДОРОГА ======================= */}
      <rect x="0" y="470" width="1280" height="90" fill="url(#roadGrad)" />
      <line x1="0" y1="470" x2="1280" y2="470" stroke="#fff" strokeOpacity="0.08" strokeWidth="2" />
      {/* пятна света на мокром асфальте */}
      <ellipse cx="80" cy="486" rx="150" ry="20" fill="#ff7a1a" opacity="0.12" filter="url(#softBlur)" />
      <ellipse cx="720" cy="500" rx="340" ry="28" fill="#1fb6f0" opacity="0.08" filter="url(#softBlur)" />
      <ellipse cx="1160" cy="490" rx="160" ry="18" fill="#ff7a1a" opacity="0.07" filter="url(#softBlur)" />
      {/* подсветка сцены */}
      <ellipse cx="700" cy="420" rx="380" ry="80" fill="#1fb6f0" opacity="0.07" filter="url(#softBlur)" />
      <ellipse cx="240" cy="430" rx="220" ry="70" fill="#ff7a1a" opacity="0.08" filter="url(#softBlur)" />

      {/* ======================= АВТОПОЕЗД ======================= */}
      <g id="rig">
        {/* выхлопная труба и зазор седла */}
        <rect x="350" y="190" width="12" height="202" rx="5" fill="#1b232f" stroke="#2a3340" strokeWidth="1.5" />
        <ellipse cx="356" cy="190" rx="6" ry="3" fill="#39434f" />
        {/* опора полуприцепа */}
        <rect x="466" y="408" width="10" height="44" fill="#161d28" />
        <rect x="458" y="450" width="26" height="6" rx="3" fill="#1c242f" />

        {/* колёса (вращаются) */}
        {WHEELS.map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="426" r="44" fill="#07090d" stroke="#1d242e" strokeWidth="6" />
            <circle cx={cx} cy="426" r="44" stroke="#fff" strokeOpacity="0.05" strokeWidth="1.5" />
            <circle cx={cx} cy="426" r="27" fill="url(#rimWheel)" stroke="#39434f" strokeWidth="2" />
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${cx} 426`}
                to={`360 ${cx} 426`}
                dur="1.6s"
                repeatCount="indefinite"
              />
              {[0, 45, 90, 135].map((a) => (
                <rect
                  key={a}
                  x={cx - 2.2}
                  y={426 - 23}
                  width="4.4"
                  height="46"
                  rx="2.2"
                  fill="#2c3542"
                  transform={`rotate(${a} ${cx} 426)`}
                />
              ))}
            </g>
            <circle cx={cx} cy="426" r="8" fill="#454f5e" />
            <circle cx={cx} cy="426" r="3.5" fill="#707c8c" />
          </g>
        ))}

        {/* рама и седло */}
        <rect x="318" y="392" width="818" height="18" rx="4" fill="#0c1117" stroke="#232b39" strokeWidth="1.5" />
        <rect x="352" y="380" width="100" height="12" rx="3" fill="#131a24" />
        <rect x="560" y="428" width="240" height="6" rx="3" fill="#10151d" />

        {/* ===== цистерна ===== */}
        {/* интерьер (рентген-окно) */}
        <rect x="384" y="188" width="744" height="192" rx="96" fill="#050a12" />
        {/* газ: едва виден всегда + постоянное внутреннее свечение */}
        <g clipPath="url(#tankClip)" opacity="0.32">
          <use href="#gasBody" />
        </g>
        <g clipPath="url(#tankClip)">
          <ellipse cx="756" cy="316" rx="330" ry="64" fill="#1fb6f0" opacity="0.16" filter="url(#softBlur)">
            <animate attributeName="opacity" values="0.11;0.2;0.11" dur="5s" repeatCount="indefinite" />
          </ellipse>
        </g>
        {/* газ: ярко — только в окне сканера */}
        <g clipPath="url(#tankClip)" mask="url(#tankScan)">
          <use href="#gasBody" />
        </g>
        {/* полупрозрачная металлическая оболочка */}
        <rect x="372" y="176" width="768" height="216" rx="108" fill="url(#shellGrad)" opacity="0.42" />
        <rect x="372" y="176" width="768" height="216" rx="108" fill="url(#shellEnds)" />
        <rect x="372" y="176" width="768" height="216" rx="108" stroke="#9fb3cc" strokeOpacity="0.28" strokeWidth="2" />
        {/* спекуляр и тёплый рефлекс */}
        <rect x="404" y="190" width="700" height="10" rx="5" fill="#fff" opacity="0.08" />
        <rect x="404" y="368" width="700" height="11" rx="5.5" fill="#ff7a1a" opacity="0.05" />
        {/* сварные швы */}
        {[516, 656, 796, 936, 1056].map((x) => (
          <line key={x} x1={x} y1="180" x2={x} y2="388" stroke="#fff" strokeOpacity="0.05" strokeWidth="2" />
        ))}
        {/* мостик, поручень, люки */}
        <rect x="536" y="166" width="460" height="7" rx="3" fill="#141b26" stroke="#2a3340" strokeWidth="1" />
        <line x1="544" y1="156" x2="988" y2="156" stroke="#39434f" strokeWidth="2" />
        {[560, 700, 840, 972].map((x) => (
          <line key={x} x1={x} y1="156" x2={x} y2="166" stroke="#39434f" strokeWidth="2" />
        ))}
        {[596, 766, 936].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy="172" rx="20" ry="9" fill="#1c242f" stroke="#465466" strokeOpacity="0.6" />
            <ellipse cx={cx} cy="166" rx="13" ry="7" fill="#232c38" stroke="#4a5563" strokeWidth="1" />
          </g>
        ))}
        {/* трап сзади */}
        <line x1="1096" y1="206" x2="1096" y2="390" stroke="#39434f" strokeWidth="3" />
        <line x1="1116" y1="206" x2="1116" y2="390" stroke="#39434f" strokeWidth="3" />
        {[226, 254, 282, 310, 338, 366].map((y) => (
          <line key={y} x1="1096" y1={y} x2="1116" y2={y} stroke="#39434f" strokeWidth="2.5" />
        ))}
        {/* габаритные огни */}
        {[450, 700, 950].map((x, i) => (
          <circle key={x} cx={x} cy="389" r="2.5" fill="#ff9540" filter="url(#glowSm)">
            <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3.4s" begin={`${i * 0.7}s`} repeatCount="indefinite" />
          </circle>
        ))}
        {/* табличка опасного груза */}
        <rect x="1106" y="330" width="24" height="17" rx="2" fill="#ff9540" stroke="#b34a06" strokeWidth="1.5" />
        {/* маркировка и логотип */}
        <g transform="translate(770 287) rotate(45)">
          <rect x="-9" y="-9" width="18" height="18" rx="4" fill="url(#fireGrad)" />
        </g>
        <text
          x="770"
          y="292"
          textAnchor="middle"
          fontFamily="Unbounded, sans-serif"
          fontSize="11"
          fontWeight="700"
          fill="#fff"
        >
          Ф
        </text>
        <text
          x="960"
          y="298"
          textAnchor="middle"
          fontFamily="Unbounded, sans-serif"
          fontSize="30"
          letterSpacing="6"
          fill="#e9f6ff"
          opacity="0.88"
        >
          СУГ · LPG
        </text>

        {/* ===== тягач (чёрный глянец) ===== */}
        {/* бампер */}
        <rect x="104" y="386" width="42" height="52" rx="10" fill="#0a0e13" stroke="#1f2733" strokeWidth="1.5" />
        <rect x="100" y="428" width="50" height="10" rx="4" fill="#05080c" />
        <rect x="110" y="396" width="30" height="3" rx="1.5" fill="#39434f" />
        {/* зеркало */}
        <path d="M152 150 L136 141 V171 L150 168 Z" fill="#0b0f15" stroke="#232b39" strokeWidth="1.5" />
        <line x1="152" y1="156" x2="162" y2="156" stroke="#232b39" strokeWidth="3" />
        {/* спойлер крыши */}
        <path d="M212 126 Q262 98 344 96 L344 130 L212 130 Z" fill="#0d1219" stroke="#2a3340" strokeWidth="1" />
        {/* корпус кабины с аркой переднего колеса */}
        <path
          d="M142 438 L142 268 Q142 246 148 230 L162 156 Q168 128 198 126 L330 126 Q344 126 344 140 L344 438 L254 438 A56 56 0 0 0 142 438 Z"
          fill="url(#cabGrad)"
        />
        {/* rim-light по передней кромке */}
        <path
          d="M148 230 L162 156 Q168 128 198 126"
          stroke="url(#rimGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.85"
          filter="url(#glowSm)"
        />
        {/* лобовое (узкая полоса сбоку) */}
        <path d="M154 222 L167 158 Q172 138 194 136 L208 136 L208 222 Z" fill="#0e2334" opacity="0.95" />
        <path d="M158 216 L169 162 Q173 146 190 143" stroke="#7fb6d8" strokeOpacity="0.4" strokeWidth="2" />
        {/* стойка и боковое окно */}
        <rect x="212" y="134" width="9" height="92" fill="#0a0f15" />
        <path
          d="M226 142 L320 142 Q331 142 331 153 L331 210 Q331 220 320 220 L236 220 Q226 220 226 210 Z"
          fill="#0d1f30"
        />
        <path d="M238 218 L300 144" stroke="#9adcff" strokeOpacity="0.16" strokeWidth="9" />
        {/* шов двери, ручка */}
        <line x1="244" y1="142" x2="244" y2="402" stroke="#000" strokeOpacity="0.45" strokeWidth="1.5" />
        <rect x="254" y="248" width="26" height="6" rx="3" fill="#2a3340" />
        {/* брендинг на двери */}
        <g transform="translate(290 300) rotate(45)">
          <rect x="-11" y="-11" width="22" height="22" rx="5" fill="url(#fireGrad)" />
        </g>
        <text
          x="290"
          y="305.5"
          textAnchor="middle"
          fontFamily="Unbounded, sans-serif"
          fontSize="13"
          fontWeight="700"
          fill="#fff"
        >
          Ф
        </text>
        <text
          x="290"
          y="342"
          textAnchor="middle"
          fontFamily="Unbounded, sans-serif"
          fontSize="10"
          letterSpacing="2.5"
          fill="#fff"
          opacity="0.6"
        >
          ФАВОРИТ
        </text>
        {/* оранжевая линия юбки */}
        <rect x="150" y="364" width="194" height="3.5" rx="1.75" fill="url(#fireGrad)" opacity="0.75" />
        {/* фара + конус света */}
        <rect x="134" y="350" width="13" height="24" rx="5" fill="#dff3ff" filter="url(#glowSm)" />
        <path d="M136 352 L-40 326 L-40 404 L136 374 Z" fill="url(#coneGrad)" opacity="0.16">
          <animate attributeName="opacity" values="0.12;0.2;0.12" dur="4s" repeatCount="indefinite" />
        </path>
        <circle cx="146" cy="412" r="4" fill="#ffb347" filter="url(#glowSm)">
          <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* ===== сканирующий луч ===== */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 554 0; 0 0"
            dur="9s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
          />
          <line x1="479" y1="148" x2="479" y2="430" stroke="#bdf1ff" strokeWidth="2.5" filter="url(#beamGlow)" />
          <line x1="479" y1="148" x2="479" y2="430" stroke="#4dd6ff" strokeWidth="10" opacity="0.16" />
          <circle cx="479" cy="148" r="4.5" fill="#dffaff" filter="url(#beamGlow)" />
          <circle cx="479" cy="430" r="4.5" fill="#dffaff" filter="url(#beamGlow)" />
        </g>
      </g>

      {/* отражение в мокром асфальте */}
      <g opacity="0.14" filter="url(#reflBlur)" mask="url(#reflFade)">
        <use href="#rig" transform="translate(0 940) scale(1 -1)" />
      </g>

      {/* разметка */}
      <line
        x1="0"
        y1="514"
        x2="1280"
        y2="514"
        stroke="#ff9540"
        strokeOpacity="0.32"
        strokeWidth="3"
        strokeDasharray="40 56"
        className="road-flow"
      />
      <line
        x1="0"
        y1="548"
        x2="1280"
        y2="548"
        stroke="#fff"
        strokeOpacity="0.05"
        strokeWidth="2"
        strokeDasharray="26 70"
      />

      {/* линии скорости (движение влево) */}
      {[
        [1168, 236, 76],
        [1190, 300, 56],
        [1156, 356, 48],
      ].map(([x, y, w]) => (
        <line
          key={y}
          x1={x}
          y1={y}
          x2={x + w}
          y2={y}
          stroke="#4dd6ff"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <animate attributeName="opacity" values="0;0.8;0" dur="1.6s" begin={`${(y % 7) / 5}s`} repeatCount="indefinite" />
        </line>
      ))}
    </svg>
  )
}

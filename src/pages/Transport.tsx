import { assets } from '../config/assets'
import { ContactButtons } from '../components/ui/ContactButtons'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'
import { ParallaxImage } from '../components/motion/ParallaxImage'
import { Marquee } from '../components/motion/Marquee'

/** Технический канон парка. Только подтверждённые данные — без домыслов. */
const canon = [
  { label: 'Тягач', value: 'MAN TGX 18.400 4x2' },
  { label: 'Полуприцеп', value: 'ППЦТ PRIZMA · LPG' },
  { label: 'Шасси', value: '3-осный полуприцеп-цистерна' },
  { label: 'Груз', value: 'СУГ · пропан' },
  { label: 'Режим перевозки', value: 'ДОПОГ · опасный груз' },
]

export function Transport() {
  return (
    <>
      <PageHeader
        image={assets.transport}
        kicker="Транспорт"
        title="Собственный парк"
        subtitle="Перевозим то, что продаём: собственная сцепка под СУГ — гарантия контроля поставки на каждом километре."
      />

      {/* ===== ТРАНСПОРТНЫЙ КАНОН ===== */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:mt-24 sm:px-8">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500 uppercase">
            Подвижной состав
          </p>
        </Reveal>
        <SplitHeading className="font-display mt-4 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
          MAN TGX + ППЦТ PRIZMA
        </SplitHeading>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <ParallaxImage
            src={assets.transport.src}
            alt={assets.transport.alt}
            className="aspect-[16/10]"
            depth={10}
          />
          <div>
            {canon.map((c, i) => (
              <Reveal key={c.label} delay={i * 90}>
                <div className="border-t border-white/12 py-6 transition-colors duration-500 hover:border-accent-500 last:border-b last:border-b-white/12">
                  <p className="text-[11px] font-semibold tracking-[0.25em] text-zinc-500 uppercase">
                    {c.label}
                  </p>
                  <p className="font-display mt-2 text-xl font-bold text-white sm:text-2xl">
                    {c.value}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Marquee
        className="mt-20 sm:mt-28"
        items={['MAN TGX 18.400', 'ППЦТ PRIZMA', 'СУГ · Пропан', 'ДОПОГ', 'Собственный парк']}
      />

      {/* ===== POSTER: ОГНЕОПАСНО (слот P01 — фон заменится финальным кадром) ===== */}
      <section className="mt-20 border-y border-white/8 bg-graphite-900/40 sm:mt-28">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500 uppercase">
              Безопасность
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-8 flex items-center gap-5 sm:gap-8" aria-hidden="true">
              <span className="h-1 flex-1 bg-accent-600/70" />
              <span className="h-1 w-10 bg-accent-500 sm:w-16" />
            </div>
          </Reveal>
          <SplitHeading className="font-display mt-6 text-[2.4rem] leading-[0.95] font-bold tracking-[0.04em] text-white uppercase sm:text-7xl lg:text-[6.5rem]">
            Огнеопасно
          </SplitHeading>
          <Reveal delay={120}>
            <div className="mt-6 flex items-center gap-5 sm:gap-8" aria-hidden="true">
              <span className="h-1 w-10 bg-accent-500 sm:w-16" />
              <span className="h-1 flex-1 bg-accent-600/70" />
            </div>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-10 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Маркировка на цистерне — не декорация. Парк работает в режиме
              перевозки опасных грузов: специализированная цистерна под СУГ
              и требования ДОПОГ на каждом этапе — от налива до слива.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-20 w-full max-w-7xl px-5 sm:mt-28 sm:px-8">
        <SplitHeading className="font-display max-w-3xl text-3xl leading-[1.05] font-bold tracking-tight text-white sm:text-5xl">
          Нужна поставка с доставкой?
        </SplitHeading>
        <Reveal delay={120}>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Согласуем объём, маршрут и условия — поставка приедет нашей цистерной.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-9">
            <ContactButtons magnetic />
          </div>
        </Reveal>
      </section>
    </>
  )
}

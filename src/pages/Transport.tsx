import { Route, ShieldCheck, Truck } from 'lucide-react'
import { assets } from '../config/assets'
import { ContactButtons } from '../components/ui/ContactButtons'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'
import { ParallaxImage } from '../components/motion/ParallaxImage'
import { Marquee } from '../components/motion/Marquee'
import { Tilt } from '../components/motion/Tilt'

const features = [
  {
    icon: Truck,
    title: 'Перевозка топлива и СУГ',
    text: 'Специализированная транспортировка нефтепродуктов и сжиженного углеводородного газа.',
  },
  {
    icon: Route,
    title: 'Гибкие маршруты',
    text: 'Направления и графики перевозок согласовываются под задачи клиента.',
  },
  {
    icon: ShieldCheck,
    title: 'Безопасность',
    text: 'Соблюдение требований к перевозке опасных грузов на каждом этапе.',
  },
]

/** Транспортный канон бренда. */
const canon = [
  { label: 'Тягач', value: 'MAN TGX 18.400 4x2' },
  { label: 'Полуприцеп', value: 'ППЦТ PRIZMA · LPG / СУГ' },
  { label: 'Груз', value: 'СУГ · светлые нефтепродукты' },
]

export function Transport() {
  return (
    <>
      <PageHeader
        image={assets.transport}
        kicker="Транспорт"
        title="Перевозка топлива и СУГ"
        subtitle="Техника — главный герой направления: специализированный подвижной состав под СУГ и нефтепродукты."
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
        items={['MAN TGX 18.400', 'ППЦТ PRIZMA', 'СУГ', 'Нефтепродукты', 'Согласованные маршруты']}
      />

      {/* преимущества */}
      <section className="mx-auto mt-20 w-full max-w-7xl px-5 sm:mt-28 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 100} className="h-full">
              <Tilt className="h-full">
                <div className="group h-full border border-white/10 bg-graphite-900/60 p-7 transition-colors duration-500 hover:border-white/25 sm:p-8">
                  <f.icon className="h-7 w-7 text-accent-400 transition-transform duration-500 group-hover:scale-110" />
                  <h2 className="font-display mt-5 text-lg font-semibold text-white">{f.title}</h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-zinc-400 sm:text-base">{f.text}</p>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-20 w-full max-w-7xl px-5 sm:mt-28 sm:px-8">
        <SplitHeading className="font-display max-w-3xl text-3xl leading-[1.05] font-bold tracking-tight text-white sm:text-5xl">
          Нужна перевозка топлива или СУГ?
        </SplitHeading>
        <Reveal delay={120}>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Согласуем маршрут, объём и условия — свяжитесь с нами удобным способом.
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

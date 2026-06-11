import { Route, ShieldCheck, Truck } from 'lucide-react'
import { assets } from '../config/assets'
import { ContactButtons } from '../components/ui/ContactButtons'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'

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

export function Transport() {
  return (
    <>
      <PageHeader
        image={assets.transport}
        kicker="Транспорт"
        title="Перевозка топлива и СУГ"
        subtitle="Оказываем транспортные услуги по перевозке топлива и СУГ. Условия перевозки и маршруты согласовываются индивидуально."
      />

      {/* преимущества */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:mt-20 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 100} className="h-full">
              <div className="h-full border border-white/10 bg-graphite-900/60 p-7 sm:p-8">
                <f.icon className="h-7 w-7 text-accent-400" />
                <h2 className="font-display mt-5 text-lg font-semibold text-white">{f.title}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-400 sm:text-base">
                  {f.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:mt-20 sm:px-8">
        <Reveal>
          <div className="border border-white/10 bg-graphite-900/60 p-8 sm:p-12">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Нужна перевозка топлива или СУГ?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Согласуем маршрут, объём и условия — свяжитесь с нами удобным способом.
              </p>
              <div className="mt-7">
                <ContactButtons />
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}

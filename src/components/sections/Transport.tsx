import { Route, ShieldCheck, Truck } from 'lucide-react'
import { ContactButtons } from '../ui/ContactButtons'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

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
    <section id="transport" className="relative overflow-hidden py-24 lg:py-32">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_50%,black,transparent)] opacity-60" />
      <div className="pointer-events-none absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-flame-600/8 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            badge="Транспорт"
            title="Транспортные услуги"
            subtitle="Оказываем транспортные услуги по перевозке топлива и сжиженного углеводородного газа. Условия, объёмы и направления перевозки согласовываются индивидуально."
          />
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 110}>
              <div className="group glass h-full rounded-3xl p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-accent-500/30">
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-accent-500/12 transition-all duration-500 group-hover:scale-110 group-hover:bg-accent-500/22">
                  <f.icon className="h-6 w-6 text-accent-400" />
                </span>
                <h3 className="mt-6 text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-3 leading-relaxed text-zinc-400">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="glass mt-12 flex flex-col items-start gap-6 rounded-3xl p-8 sm:flex-row sm:items-center sm:justify-between lg:p-10">
            <div>
              <h3 className="font-display text-xl font-bold text-white">
                Нужна перевозка топлива или СУГ?
              </h3>
              <p className="mt-2 text-zinc-400">
                Согласуем маршрут, объём и условия — свяжитесь с нами.
              </p>
            </div>
            <ContactButtons />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

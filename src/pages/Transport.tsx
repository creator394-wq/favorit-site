import { Route, ShieldCheck, Truck } from 'lucide-react'
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
      <Reveal>
        <PageHeader
          badge="Транспорт"
          title="Транспортные услуги"
          subtitle="Оказываем транспортные услуги по перевозке топлива и СУГ. Условия перевозки и маршруты согласовываются индивидуально."
        />
      </Reveal>

      <div className="grid gap-5 md:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 90} className="h-full">
            <div className="group glass h-full rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:border-accent-500/30 sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/12 transition-all duration-500 group-hover:scale-110 group-hover:bg-accent-500/22">
                <f.icon className="h-6 w-6 text-accent-400" />
              </span>
              <h2 className="mt-5 text-lg font-bold text-white">{f.title}</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-400 sm:text-base">
                {f.text}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={180}>
        <div className="glass mt-8 flex flex-col items-start gap-5 rounded-2xl p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-white sm:text-xl">
              Нужна перевозка топлива или СУГ?
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400 sm:text-base">
              Согласуем маршрут, объём и условия — свяжитесь с нами.
            </p>
          </div>
          <ContactButtons />
        </div>
      </Reveal>
    </>
  )
}

import { ArrowUpRight, Fuel, Package, Truck } from 'lucide-react'
import { contacts } from '../../data/contacts'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

const cards = [
  {
    icon: Package,
    num: '01',
    title: 'ОПТ',
    text: 'Оптовые поставки СУГ и нефтепродуктов для предприятий и организаций. Условия поставок обсуждаются индивидуально.',
    cta: 'Связаться по опту',
    href: contacts.phoneHref,
    external: false,
  },
  {
    icon: Fuel,
    num: '02',
    title: 'ЗАПРАВКИ',
    text: 'Собственные автозаправочные станции с актуальными ценами на топливо.',
    cta: 'Посмотреть АЗС',
    href: '#azs',
    external: false,
  },
  {
    icon: Truck,
    num: '03',
    title: 'ТРАНСПОРТ',
    text: 'Транспортные услуги по перевозке топлива и СУГ. Маршруты и условия согласовываются индивидуально.',
    cta: 'Узнать подробнее',
    href: '#transport',
    external: false,
  },
]

export function Directions() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            badge="Направления"
            title="Три направления бизнеса"
            subtitle="Полный цикл работы с топливом и энергетическими ресурсами — от оптовых поставок до розничной реализации."
          />
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 120}>
              <a
                href={card.href}
                className="group glass relative flex h-full flex-col overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:border-accent-500/35 lg:p-10"
              >
                <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-accent-500/0 blur-3xl transition-all duration-700 group-hover:bg-accent-500/15" />

                <div className="flex items-start justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/20 to-flame-600/10 transition-transform duration-500 group-hover:scale-110">
                    <card.icon className="h-7 w-7 text-accent-400" />
                  </span>
                  <span className="font-display text-4xl font-bold text-white/6 transition-colors duration-500 group-hover:text-accent-500/20">
                    {card.num}
                  </span>
                </div>

                <h3 className="font-display mt-8 text-xl font-bold tracking-wide text-white lg:text-2xl">
                  {card.title}
                </h3>
                <p className="mt-4 flex-1 leading-relaxed text-zinc-400">{card.text}</p>

                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-accent-400 transition-colors duration-300 group-hover:text-accent-500">
                  {card.cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

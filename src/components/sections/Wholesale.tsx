import { Briefcase, Droplets, Flame, Handshake } from 'lucide-react'
import { ContactButtons } from '../ui/ContactButtons'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

const blocks = [
  {
    icon: Flame,
    title: 'СУГ',
    text: 'Оптовые поставки сжиженного углеводородного газа для предприятий и организаций.',
  },
  {
    icon: Droplets,
    title: 'Нефтепродукты',
    text: 'Бензины, дизельное топливо и другие нефтепродукты оптовыми партиями.',
  },
  {
    icon: Briefcase,
    title: 'Работа с юридическими лицами',
    text: 'Договорная работа, документооборот и прозрачные условия для бизнеса.',
  },
  {
    icon: Handshake,
    title: 'Индивидуальные условия сотрудничества',
    text: 'Объёмы, графики и формат поставок подбираются под задачи клиента.',
  },
]

export function Wholesale() {
  return (
    <section id="opt" className="relative overflow-hidden py-24 lg:py-32">
      <div className="bg-diagonal pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]" />
      <div className="pointer-events-none absolute top-1/4 -left-40 h-96 w-96 rounded-full bg-accent-500/8 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            badge="Опт"
            title="Оптовые поставки"
            subtitle="Поставки осуществляются по согласованным направлениям."
          />
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2">
          {blocks.map((block, i) => (
            <Reveal key={block.title} delay={i * 100}>
              <div className="group glass flex h-full gap-5 rounded-3xl p-7 transition-all duration-500 hover:border-accent-500/30 hover:bg-white/6 lg:p-8">
                <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-accent-500/12 transition-all duration-500 group-hover:bg-accent-500/22 group-hover:scale-105">
                  <block.icon className="h-6 w-6 text-accent-400" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">{block.title}</h3>
                  <p className="mt-2 leading-relaxed text-zinc-400">{block.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="glass mt-12 flex flex-col items-start gap-6 rounded-3xl p-8 sm:flex-row sm:items-center sm:justify-between lg:p-10">
            <div>
              <h3 className="font-display text-xl font-bold text-white">
                Обсудим условия поставки?
              </h3>
              <p className="mt-2 text-zinc-400">
                Свяжитесь с менеджером удобным способом — ответим на все вопросы.
              </p>
            </div>
            <ContactButtons />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

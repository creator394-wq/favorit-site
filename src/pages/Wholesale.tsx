import { Briefcase, Droplets, Flame, Handshake } from 'lucide-react'
import { news } from '../data/news'
import { NewsCard } from '../components/NewsCard'
import { ContactButtons } from '../components/ui/ContactButtons'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'

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
    title: 'Индивидуальные условия',
    text: 'Объёмы, графики и формат поставок подбираются под задачи клиента.',
  },
]

export function Wholesale() {
  const marketNews = news
    .filter((n) => n.category === 'Опт' || n.category === 'Рынок')
    .slice(0, 4)

  return (
    <>
      <Reveal>
        <PageHeader
          badge="Опт"
          title="Оптовые поставки"
          subtitle="Поставки осуществляются по согласованным направлениям."
        />
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2">
        {blocks.map((block, i) => (
          <Reveal key={block.title} delay={i * 90} className="h-full">
            <div className="group glass flex h-full gap-5 rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:border-accent-500/30 sm:p-7">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-500/12 transition-all duration-500 group-hover:scale-105 group-hover:bg-accent-500/22">
                <block.icon className="h-6 w-6 text-accent-400" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">{block.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
                  {block.text}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={150}>
        <div className="glass mt-8 flex flex-col items-start gap-5 rounded-2xl p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-white sm:text-xl">
              Обсудим условия поставки?
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400 sm:text-base">
              Свяжитесь с менеджером удобным способом — ответим на все вопросы.
            </p>
          </div>
          <ContactButtons />
        </div>
      </Reveal>

      <Reveal delay={200}>
        <h2 className="font-display mt-12 text-xl font-bold text-white sm:text-2xl">
          Новости рынка и опта
        </h2>
      </Reveal>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {marketNews.map((item, i) => (
          <Reveal key={item.id} delay={i * 80} className="h-full">
            <NewsCard item={item} />
          </Reveal>
        ))}
      </div>
    </>
  )
}

import { Briefcase, Droplets, Flame, Handshake } from 'lucide-react'
import { news } from '../data/news'
import { assets } from '../config/assets'
import { NewsCard } from '../components/NewsCard'
import { ContactButtons } from '../components/ui/ContactButtons'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'
import { Tilt } from '../components/motion/Tilt'

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

const pipeline = [
  { step: '01', title: 'Запрос', text: 'Вы описываете задачу: продукт, объём, сроки.' },
  { step: '02', title: 'Согласование', text: 'Фиксируем условия, цену и график поставки.' },
  { step: '03', title: 'Логистика', text: 'Подбираем маршрут и транспорт под поставку.' },
  { step: '04', title: 'Поставка', text: 'Доставка точно в согласованные сроки.' },
  { step: '05', title: 'Документы', text: 'Полный пакет закрывающих документов.' },
]

export function Wholesale() {
  const marketNews = news
    .filter((n) => n.category === 'Опт' || n.category === 'Рынок')
    .slice(0, 4)

  return (
    <>
      <PageHeader
        image={assets.wholesale}
        kicker="Опт"
        title="Оптовые поставки СУГ и нефтепродуктов"
        subtitle="Поставки осуществляются по согласованным направлениям. Работаем с юридическими лицами: договор, документооборот, прозрачные условия."
      />

      {/* направления опта */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:mt-20 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {blocks.map((block, i) => (
            <Reveal key={block.title} delay={i * 90} className="h-full">
              <Tilt className="h-full">
                <div className="group h-full border border-white/10 bg-graphite-900/60 p-7 transition-colors duration-500 hover:border-white/25 sm:p-8">
                  <block.icon className="h-7 w-7 text-accent-400 transition-transform duration-500 group-hover:scale-110" />
                <h2 className="font-display mt-5 text-lg font-semibold text-white sm:text-xl">
                  {block.title}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-400 sm:text-base">
                  {block.text}
                </p>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* этапы поставки */}
      <section className="mt-20 border-y border-white/8 bg-graphite-900/40 py-16 sm:mt-24 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              Процесс
            </p>
          </Reveal>
          <SplitHeading className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Как проходит поставка
          </SplitHeading>

          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
            {pipeline.map((p, i) => (
              <Reveal key={p.step} delay={i * 80}>
                <div className="border-t border-white/15 pt-5">
                  <span className="font-display text-sm font-semibold text-accent-400">
                    {p.step}
                  </span>
                  <h3 className="font-display mt-3 text-base font-semibold text-white">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-20 w-full max-w-7xl px-5 sm:mt-24 sm:px-8">
        <Reveal>
          <div className="flex flex-col items-start gap-6 border border-white/10 bg-graphite-900/60 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                Обсудим условия поставки?
              </h2>
              <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                Свяжитесь с менеджером удобным способом — ответим на все вопросы.
              </p>
            </div>
            <ContactButtons />
          </div>
        </Reveal>
      </section>

      {/* новости рынка */}
      <section className="mx-auto mt-20 w-full max-w-7xl px-5 sm:mt-24 sm:px-8">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.28em] text-zinc-500 uppercase">Рынок</p>
          <h2 className="font-display mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Новости рынка и опта
          </h2>
        </Reveal>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {marketNews.map((item, i) => (
            <Reveal key={item.id} delay={i * 80} className="h-full">
              <NewsCard item={item} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}

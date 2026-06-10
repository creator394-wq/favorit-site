import { Briefcase, Droplets, Flame, Handshake } from 'lucide-react'
import { news } from '../data/news'
import { NewsCard } from '../components/NewsCard'
import { ContactButtons } from '../components/ui/ContactButtons'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { TiltCard } from '../components/ui/TiltCard'
import { RouteLines } from '../components/scene/RouteLines'

const blocks = [
  {
    icon: Flame,
    title: 'СУГ',
    text: 'Оптовые поставки сжиженного углеводородного газа для предприятий и организаций.',
    glow: 'bg-gas-500/14',
    iconBox: 'bg-gas-500/12 text-gas-400 border-gas-400/30',
  },
  {
    icon: Droplets,
    title: 'Нефтепродукты',
    text: 'Бензины, дизельное топливо и другие нефтепродукты оптовыми партиями.',
    glow: 'bg-accent-500/14',
    iconBox: 'bg-accent-500/12 text-accent-400 border-accent-500/30',
  },
  {
    icon: Briefcase,
    title: 'Работа с юридическими лицами',
    text: 'Договорная работа, документооборот и прозрачные условия для бизнеса.',
    glow: 'bg-amber-400/12',
    iconBox: 'bg-amber-400/12 text-amber-400 border-amber-400/30',
  },
  {
    icon: Handshake,
    title: 'Индивидуальные условия',
    text: 'Объёмы, графики и формат поставок подбираются под задачи клиента.',
    glow: 'bg-flame-600/12',
    iconBox: 'bg-flame-600/12 text-accent-400 border-flame-600/30',
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
        badge="Опт"
        title="Оптовые поставки"
        accent="СУГ и нефтепродуктов"
        subtitle="Поставки осуществляются по согласованным направлениям. Работаем с юридическими лицами: договор, документооборот, прозрачные условия."
      />

      {/* направления опта */}
      <section className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {blocks.map((block, i) => (
            <Reveal key={block.title} delay={i * 90} className="h-full">
              <TiltCard className="h-full">
                <div className="panel relative h-full overflow-hidden rounded-3xl p-7 sm:p-8">
                  <div
                    className={`pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl ${block.glow}`}
                  />
                  <span
                    className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border ${block.iconBox}`}
                  >
                    <block.icon className="h-7 w-7" />
                  </span>
                  <h2 className="font-display relative mt-5 text-lg font-bold text-white sm:text-xl">
                    {block.title}
                  </h2>
                  <p className="relative mt-2.5 text-sm leading-relaxed text-zinc-400 sm:text-base">
                    {block.text}
                  </p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* визуальный pipeline поставки */}
      <section className="relative mt-20 overflow-hidden py-16 sm:mt-24 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-diagonal opacity-50" />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <span className="text-xs font-semibold tracking-[0.24em] text-zinc-500 uppercase">
              Процесс
            </span>
            <h2 className="font-display mt-3 text-2xl font-bold text-white sm:text-4xl">
              Как проходит <span className="text-gradient-fire">поставка</span>
            </h2>
          </Reveal>

          {/* desktop: горизонтальный конвейер; mobile: вертикальный */}
          <div className="mt-12 flex flex-col gap-2 lg:flex-row lg:items-start lg:gap-0">
            {pipeline.map((p, i) => (
              <div key={p.step} className="contents">
                {i > 0 && (
                  <>
                    <div className="flow-line-v ml-7 h-10 lg:hidden">
                      <span className="flow-dot" />
                    </div>
                    <div className="flow-line mx-1.5 mt-7 hidden min-w-6 flex-1 lg:block">
                      <span className="flow-dot" />
                    </div>
                  </>
                )}
                <Reveal delay={i * 90} className="lg:w-44 lg:shrink-0 xl:w-48">
                  <div className="flex items-start gap-4 lg:block">
                    <span className="font-display glass relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-accent-400 glow-accent">
                      {p.step}
                    </span>
                    <div className="lg:mt-4">
                      <h3 className="font-display text-base font-bold text-white">{p.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{p.text}</p>
                    </div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-4 w-full max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="panel relative overflow-hidden rounded-3xl p-8 sm:p-10">
            <RouteLines className="pointer-events-none absolute inset-0 h-full w-full" opacity={0.6} />
            <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                  Обсудим условия поставки?
                </h2>
                <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                  Свяжитесь с менеджером удобным способом — ответим на все вопросы.
                </p>
              </div>
              <ContactButtons />
            </div>
          </div>
        </Reveal>
      </section>

      {/* новости рынка */}
      <section className="mx-auto mt-20 w-full max-w-7xl px-5 sm:mt-24 sm:px-8">
        <Reveal>
          <span className="text-xs font-semibold tracking-[0.24em] text-zinc-500 uppercase">
            Рынок
          </span>
          <h2 className="font-display mt-3 text-2xl font-bold text-white sm:text-3xl">
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

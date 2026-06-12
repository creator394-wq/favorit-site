import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { news } from '../data/news'
import { company, contacts } from '../data/contacts'
import { assets } from '../config/assets'
import { formatDate } from '../lib/format'
import { Reveal } from '../components/ui/Reveal'
import { ContactButtons } from '../components/ui/ContactButtons'
import { SplitHeading } from '../components/motion/SplitHeading'
import { Magnetic } from '../components/motion/Magnetic'
import { Counter } from '../components/motion/Counter'
import { Marquee } from '../components/motion/Marquee'
import { ParallaxImage } from '../components/motion/ParallaxImage'

const workflow = [
  {
    step: '01',
    title: 'Терминал',
    text: 'Запрос, фиксация цены и объёма, налив партии СУГ на терминале.',
  },
  {
    step: '02',
    title: 'Цистерна',
    text: 'Собственная сцепка MAN TGX + ППЦТ PRIZMA везёт груз по согласованному маршруту.',
  },
  {
    step: '03',
    title: 'Клиент',
    text: 'Поставка точно в срок и полный пакет закрывающих документов.',
  },
]

const years = new Date().getFullYear() - company.sinceYear

export function Home() {
  const hero = useRef<HTMLElement>(null)
  const heroImg = useRef<HTMLImageElement>(null)

  useEffect(() => {
    document.title = 'ООО «Фаворит» — топливо, СУГ и логистика'
  }, [])

  /* ===== HERO: въезд камеры + параллакс при скролле ===== */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      gsap.fromTo(
        heroImg.current,
        { scale: 1.22 },
        { scale: 1.06, duration: 2.2, ease: 'power3.out' },
      )
      gsap.to(heroImg.current, {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: { trigger: hero.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      // контент уезжает и гаснет, пока hero покидает кадр — глубина сцены
      gsap.to('[data-hero-content]', {
        yPercent: -14,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: hero.current, start: 'top top', end: '75% top', scrub: true },
      })
      gsap.from('[data-hero-fade]', {
        opacity: 0,
        y: 26,
        duration: 1,
        stagger: 0.12,
        delay: 0.55,
        ease: 'power3.out',
      })
      gsap.from('[data-hero-line]', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1,
        delay: 0.4,
        ease: 'power3.inOut',
      })
    },
    { scope: hero },
  )

  const featured = news[0]
  const rest = news.slice(1, 4)

  return (
    <>
      {/* ===== CINEMATIC HERO ===== */}
      <section ref={hero} className="relative flex min-h-svh flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img
            ref={heroImg}
            src={assets.hero.src}
            alt={assets.hero.alt}
            className="h-full w-full object-cover will-change-transform"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-graphite-950/90 via-graphite-950/45 to-graphite-950/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite-950 via-transparent to-graphite-950/40" />
        </div>

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center px-5 pt-28 pb-10 sm:px-8">
          <div data-hero-content className="max-w-3xl will-change-transform">
            <p
              data-hero-fade
              className="flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-accent-400 uppercase"
            >
              <span data-hero-line className="h-px w-10 bg-accent-500" />
              СУГ · Нефтепродукты · Оптовые поставки
            </p>
            <SplitHeading
              as="h1"
              onScroll={false}
              delay={0.35}
              className="font-display mt-7 text-[2.7rem] leading-[0.98] font-bold tracking-tight text-white sm:text-7xl lg:text-[5.6rem]"
            >
              Энергия в движении
            </SplitHeading>
            <p
              data-hero-fade
              className="mt-7 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg"
            >
              Оптовые поставки СУГ и нефтепродуктов, собственные АЗС и
              специализированный транспорт — одна система под контролем компании
              с {company.sinceYear} года.
            </p>
            <div data-hero-fade className="mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
              <Magnetic>
                <Link
                  to="/wholesale"
                  className="group inline-flex items-center gap-2.5 bg-accent-500 px-7 py-4 text-sm font-semibold text-graphite-950 transition-colors duration-300 hover:bg-accent-400 sm:text-base"
                >
                  Оптовые поставки
                  <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Magnetic>
              <Magnetic>
                <Link
                  to="/stations"
                  className="inline-flex items-center gap-2.5 border border-white/25 px-7 py-4 text-sm font-semibold text-white transition-colors duration-300 hover:border-white/60 sm:text-base"
                >
                  Заправки и цены
                </Link>
              </Magnetic>
            </div>
          </div>

          {/* scroll-индикатор */}
          <div
            data-hero-fade
            className="absolute right-8 bottom-8 hidden flex-col items-center gap-3 lg:flex"
            aria-hidden="true"
          >
            <span className="text-[10px] font-semibold tracking-[0.3em] text-zinc-500 uppercase [writing-mode:vertical-rl]">
              Скролл
            </span>
            <span className="relative h-16 w-px overflow-hidden bg-white/15">
              <span className="absolute top-0 left-0 h-5 w-px animate-[scroll-hint_1.8s_ease-in-out_infinite] bg-accent-500" />
            </span>
          </div>
        </div>

        {/* полоса фактов: счётчики */}
        <div data-hero-fade className="relative border-t border-white/10 backdrop-blur-[2px]">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-y-6 px-5 py-7 sm:px-8 lg:grid-cols-4">
            <div>
              <div className="font-display text-3xl font-bold text-white">
                <Counter value={years} suffix="+" />
              </div>
              <p className="mt-1 text-xs tracking-wide text-zinc-400">лет работы · с {company.sinceYear}</p>
            </div>
            <div className="lg:border-l lg:border-white/10 lg:pl-8">
              <div className="font-display text-3xl font-bold text-white">
                <Counter value={2} />
              </div>
              <p className="mt-1 text-xs tracking-wide text-zinc-400">собственные АЗС · розничная сеть</p>
            </div>
            <div className="lg:border-l lg:border-white/10 lg:pl-8">
              <div className="font-display text-3xl font-bold text-white">СУГ</div>
              <p className="mt-1 text-xs tracking-wide text-zinc-400">и нефтепродукты · опт и розница</p>
            </div>
            <div className="lg:border-l lg:border-white/10 lg:pl-8">
              <div className="font-display text-3xl font-bold text-white">MAN TGX</div>
              <p className="mt-1 text-xs tracking-wide text-zinc-400">собственный парк под СУГ</p>
            </div>
          </div>
        </div>
      </section>

      <Marquee
        items={['СУГ', 'Нефтепродукты', 'АЗС', 'Транспорт', `С ${company.sinceYear} года`, 'Прямой контакт']}
      />

      {/* ===== НАПРАВЛЕНИЯ: иерархия бизнеса ===== */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500 uppercase">
              Направления
            </p>
          </Reveal>
          <SplitHeading className="font-display mt-4 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Опт, розница и собственная логистика
          </SplitHeading>

          {/* 01 — Опт СУГ: главное направление */}
          <Link to="/wholesale" className="group relative mt-12 block">
            <div className="relative h-[52vh] overflow-hidden sm:h-[60vh] lg:h-[70vh]">
              <ParallaxImage
                src={assets.wholesale.src}
                alt={assets.wholesale.alt}
                depth={7}
                className="absolute inset-0 transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/90 via-graphite-950/25 to-transparent" />
              <ArrowUpRight className="absolute top-6 right-6 h-6 w-6 text-white/60 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-accent-400" />
              <div className="absolute right-6 bottom-8 left-6 sm:right-10 sm:bottom-12 sm:left-10">
                <p className="text-[11px] font-semibold tracking-[0.28em] text-accent-400 uppercase">
                  01 · Главное направление
                </p>
                <h3 className="font-display mt-3 max-w-3xl text-3xl leading-[1.02] font-bold text-white sm:text-5xl lg:text-6xl">
                  Оптовые поставки СУГ
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                  Сжиженный углеводородный газ и нефтепродукты оптовыми партиями для
                  юридических лиц. Договор, прозрачные условия, поставка точно в срок.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-accent-400 uppercase">
                  Подробнее
                  <span className="h-px w-8 bg-accent-500 transition-all duration-300 group-hover:w-14" />
                </span>
              </div>
            </div>
          </Link>

          {/* 02 — АЗС и 03 — собственный парк */}
          <div className="mt-8 grid gap-8 lg:grid-cols-5">
            <Link to="/stations" className="group relative block lg:col-span-3">
              <div className="relative h-[40vh] overflow-hidden sm:h-[46vh]">
                <ParallaxImage
                  src={assets.stations.src}
                  alt={assets.stations.alt}
                  depth={7}
                  className="absolute inset-0 transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/85 via-graphite-950/20 to-transparent" />
                <ArrowUpRight className="absolute top-5 right-5 h-5 w-5 text-white/60 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-accent-400" />
                <div className="absolute right-6 bottom-6 left-6 sm:bottom-8 sm:left-8">
                  <p className="text-[11px] font-semibold tracking-[0.28em] text-accent-400 uppercase">
                    02 · Розничная сеть
                  </p>
                  <h3 className="font-display mt-2.5 text-2xl leading-tight font-bold text-white sm:text-4xl">
                    Автозаправочные станции
                  </h3>
                  <p className="mt-2.5 max-w-md text-sm leading-relaxed text-zinc-300">
                    Собственные АЗС с актуальными ценами на топливо. Розница под
                    контролем компании.
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/transport" className="group relative block lg:col-span-2">
              <div className="relative h-[40vh] overflow-hidden sm:h-[46vh]">
                <ParallaxImage
                  src={assets.transport.src}
                  alt={assets.transport.alt}
                  depth={7}
                  className="absolute inset-0 transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/85 via-graphite-950/20 to-transparent" />
                <ArrowUpRight className="absolute top-5 right-5 h-5 w-5 text-white/60 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-accent-400" />
                <div className="absolute right-6 bottom-6 left-6 sm:bottom-8 sm:left-8">
                  <p className="text-[11px] font-semibold tracking-[0.28em] text-accent-400 uppercase">
                    03 · Собственная логистика
                  </p>
                  <h3 className="font-display mt-2.5 text-2xl leading-tight font-bold text-white sm:text-3xl">
                    Собственный парк
                  </h3>
                  <p className="mt-2.5 max-w-md text-sm leading-relaxed text-zinc-300">
                    MAN TGX с цистерной ППЦТ PRIZMA: перевозим то, что продаём.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== ЛИНИЯ ПОСТАВКИ ===== */}
      <section className="border-y border-white/8 bg-graphite-900/40 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500 uppercase">
              Схема работы
            </p>
          </Reveal>
          <SplitHeading className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            От терминала до клиента
          </SplitHeading>

          <div className="relative mt-14">
            {/* непрерывная линия поставки через узлы */}
            <div className="absolute top-[5px] right-0 left-0 hidden h-px bg-white/15 sm:block" aria-hidden="true" />
            <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
              {workflow.map((w, i) => (
                <Reveal key={w.step} delay={i * 120}>
                  <div className="relative">
                    <span className="block h-[11px] w-[11px] rounded-full bg-accent-500" />
                    <span className="font-display mt-5 block text-sm font-semibold text-accent-400">
                      {w.step}
                    </span>
                    <h3 className="font-display mt-2 text-xl font-semibold text-white sm:text-2xl">
                      {w.title}
                    </h3>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">{w.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={200}>
            <p className="mt-14 max-w-xl text-sm leading-relaxed text-zinc-500">
              Все этапы — от закупки до поставки клиенту — под контролем одной компании.
              Условия и объёмы согласовываются с менеджером:{' '}
              <a
                href={contacts.phoneHref}
                className="font-semibold text-accent-400 transition-colors hover:text-accent-500"
              >
                {contacts.phoneDisplay}
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== НОВОСТИ: короткий редакционный блок ===== */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500 uppercase">
              Новости компании
            </p>
          </Reveal>
          <SplitHeading className="font-display mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Новости
          </SplitHeading>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-16">
            {/* главная новость */}
            <Reveal>
              <article className="group">
                <div className="flex items-baseline gap-4 border-t-2 border-accent-500 pt-5">
                  <span className="text-[11px] font-semibold tracking-[0.22em] text-accent-400 uppercase">
                    {featured.category}
                  </span>
                  <span className="text-xs text-zinc-500">{formatDate(featured.date)}</span>
                </div>
                <h3 className="font-display mt-4 text-xl leading-[1.15] font-bold text-white sm:text-2xl">
                  {featured.title}
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                  {featured.description}
                </p>
              </article>
            </Reveal>

            {/* лента второстепенных */}
            <div>
              {rest.map((item, i) => (
                <Reveal key={item.id} delay={i * 80}>
                  <article className="group border-t border-white/10 py-5 first:border-t-0 first:pt-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[10px] font-semibold tracking-[0.22em] text-zinc-500 uppercase">
                        {item.category}
                      </span>
                      <span className="text-xs whitespace-nowrap text-zinc-600">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    <h4 className="font-display mt-2.5 text-base leading-snug font-semibold text-zinc-200 transition-colors duration-300 group-hover:text-accent-400">
                      {item.title}
                    </h4>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== КОНТАКТ-CTA ===== */}
      <section className="border-t border-white/8 py-24 sm:py-32">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <SplitHeading className="font-display max-w-4xl text-4xl leading-[1.02] font-bold tracking-tight text-white sm:text-6xl">
            Обсудим поставку?
          </SplitHeading>
          <Reveal delay={120}>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
              Прямой контакт с менеджером — без форм и посредников.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-10">
              <ContactButtons size="lg" magnetic />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

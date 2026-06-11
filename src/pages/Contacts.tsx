import { ArrowUpRight, Mail, MessageCircle, Phone, Send } from 'lucide-react'
import { useEffect } from 'react'
import { contacts } from '../data/contacts'
import { Reveal } from '../components/ui/Reveal'
import { SplitHeading } from '../components/motion/SplitHeading'
import { Magnetic } from '../components/motion/Magnetic'

const cards = [
  {
    icon: Phone,
    title: 'Телефон',
    value: contacts.phoneDisplay,
    href: contacts.phoneHref,
    external: false,
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    value: 'Написать в WhatsApp',
    href: contacts.whatsapp,
    external: true,
  },
  {
    icon: Send,
    title: 'Telegram',
    value: 'Написать в Telegram',
    href: contacts.telegram,
    external: true,
  },
  {
    icon: Mail,
    title: 'Email',
    value: contacts.email,
    href: `mailto:${contacts.email}`,
    external: false,
  },
]

export function Contacts() {
  useEffect(() => {
    document.title = 'Контакты — ООО «Фаворит»'
  }, [])

  return (
    <>
      {/* типографический хедер */}
      <section className="mx-auto w-full max-w-7xl px-5 pt-44 pb-4 sm:px-8 sm:pt-52">
        <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-accent-400 uppercase">
          <span className="h-px w-10 bg-accent-500" />
          Контакты
        </p>
        <SplitHeading
          as="h1"
          onScroll={false}
          delay={0.25}
          className="font-display mt-6 max-w-4xl text-4xl leading-[1.02] font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          Связаться с нами
        </SplitHeading>
        <Reveal delay={150}>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Только прямой контакт — позвоните или напишите менеджеру, ответим оперативно.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto mt-14 w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 90} className="h-full">
              <Magnetic strength={10} className="block h-full w-full">
                <a
                  href={card.href}
                  {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="group flex h-full items-center gap-5 border border-white/10 bg-graphite-900/60 p-6 transition-colors duration-300 hover:border-accent-500/60 sm:gap-6 sm:p-8"
                >
                  <card.icon className="h-7 w-7 shrink-0 text-accent-400 transition-transform duration-500 group-hover:scale-110" />
                  <span className="min-w-0 flex-1">
                    <h2 className="font-display text-base font-semibold text-white sm:text-xl">
                      {card.title}
                    </h2>
                    <p className="mt-1 truncate text-sm text-zinc-400 sm:text-base">{card.value}</p>
                  </span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-zinc-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-400" />
                </a>
              </Magnetic>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mt-7 text-sm text-zinc-500">
            Обращения принимаются только по телефону, в WhatsApp, Telegram и по email —
            без форм и онлайн-заявок.
          </p>
        </Reveal>
      </section>
    </>
  )
}

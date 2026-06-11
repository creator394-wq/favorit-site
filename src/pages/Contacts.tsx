import { ArrowUpRight, Mail, MessageCircle, Phone, Send } from 'lucide-react'
import { useEffect } from 'react'
import { contacts } from '../data/contacts'
import { Reveal } from '../components/ui/Reveal'

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
      {/* текстовый хедер: контакты не требуют фото-слота */}
      <section className="mx-auto w-full max-w-7xl px-5 pt-40 pb-4 sm:px-8 sm:pt-44">
        <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-accent-400 uppercase">
          <span className="h-px w-8 bg-accent-500" />
          Контакты
        </p>
        <h1 className="font-display mt-5 max-w-4xl text-4xl leading-[1.05] font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Связаться с нами
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          Только прямой контакт — позвоните или напишите менеджеру, ответим оперативно.
        </p>
      </section>

      <section className="mx-auto mt-12 w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 90} className="h-full">
              <a
                href={card.href}
                {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="group flex h-full items-center gap-5 border border-white/10 bg-graphite-900/60 p-6 transition-colors duration-300 hover:border-white/30 sm:gap-6 sm:p-8"
              >
                <card.icon className="h-7 w-7 shrink-0 text-accent-400" />
                <span className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-semibold text-white sm:text-xl">
                    {card.title}
                  </h2>
                  <p className="mt-1 truncate text-sm text-zinc-400 sm:text-base">{card.value}</p>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-zinc-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
              </a>
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

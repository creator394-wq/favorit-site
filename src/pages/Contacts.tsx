import { ArrowUpRight, Mail, MessageCircle, Phone, Send } from 'lucide-react'
import { contacts } from '../data/contacts'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'

const cards = [
  {
    icon: Phone,
    title: 'Телефон',
    value: contacts.phoneDisplay,
    href: contacts.phoneHref,
    external: false,
    accent: 'hover:border-accent-500/40',
    iconBg: 'bg-accent-500/15 text-accent-400',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    value: 'Написать в WhatsApp',
    href: contacts.whatsapp,
    external: true,
    accent: 'hover:border-emerald-400/40',
    iconBg: 'bg-emerald-400/15 text-emerald-400',
  },
  {
    icon: Send,
    title: 'Telegram',
    value: 'Написать в Telegram',
    href: contacts.telegram,
    external: true,
    accent: 'hover:border-sky-400/40',
    iconBg: 'bg-sky-400/15 text-sky-400',
  },
  {
    icon: Mail,
    title: 'Email',
    value: contacts.email,
    href: `mailto:${contacts.email}`,
    external: false,
    accent: 'hover:border-amber-400/40',
    iconBg: 'bg-amber-400/15 text-amber-400',
  },
]

export function Contacts() {
  return (
    <>
      <Reveal>
        <PageHeader
          badge="Контакты"
          title="Связаться с нами"
          subtitle="Только прямой контакт — позвоните или напишите менеджеру, ответим оперативно."
        />
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        {cards.map((card, i) => (
          <Reveal key={card.title} delay={i * 90} className="h-full">
            <a
              href={card.href}
              {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={`group glass flex h-full items-center gap-4 rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 sm:gap-5 sm:rounded-3xl sm:p-7 ${card.accent}`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 sm:h-14 sm:w-14 sm:rounded-2xl ${card.iconBg}`}
              >
                <card.icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-white sm:text-lg">{card.title}</h2>
                <p className="mt-0.5 truncate text-sm text-zinc-400 sm:text-base">
                  {card.value}
                </p>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-zinc-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
            </a>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200}>
        <p className="mt-6 text-sm text-zinc-500">
          Обращения принимаются только по телефону, в WhatsApp, Telegram и по email —
          без форм и онлайн-заявок.
        </p>
      </Reveal>
    </>
  )
}

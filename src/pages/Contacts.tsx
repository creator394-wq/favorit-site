import { ArrowUpRight, Mail, MessageCircle, Phone, Send } from 'lucide-react'
import { contacts } from '../data/contacts'
import { PageHeader } from '../components/ui/PageHeader'
import { Reveal } from '../components/ui/Reveal'
import { TiltCard } from '../components/ui/TiltCard'

const cards = [
  {
    icon: Phone,
    title: 'Телефон',
    value: contacts.phoneDisplay,
    href: contacts.phoneHref,
    external: false,
    border: 'hover:border-accent-500/45',
    iconBox: 'border-accent-500/30 bg-accent-500/12 text-accent-400',
    glow: 'bg-accent-500/12',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    value: 'Написать в WhatsApp',
    href: contacts.whatsapp,
    external: true,
    border: 'hover:border-emerald-400/45',
    iconBox: 'border-emerald-400/30 bg-emerald-400/12 text-emerald-400',
    glow: 'bg-emerald-400/10',
  },
  {
    icon: Send,
    title: 'Telegram',
    value: 'Написать в Telegram',
    href: contacts.telegram,
    external: true,
    border: 'hover:border-sky-400/45',
    iconBox: 'border-sky-400/30 bg-sky-400/12 text-sky-400',
    glow: 'bg-sky-400/10',
  },
  {
    icon: Mail,
    title: 'Email',
    value: contacts.email,
    href: `mailto:${contacts.email}`,
    external: false,
    border: 'hover:border-amber-400/45',
    iconBox: 'border-amber-400/30 bg-amber-400/12 text-amber-400',
    glow: 'bg-amber-400/10',
  },
]

export function Contacts() {
  return (
    <>
      <PageHeader
        badge="Контакты"
        title="Связаться"
        accent="с нами"
        subtitle="Только прямой контакт — позвоните или напишите менеджеру, ответим оперативно."
      />

      <section className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 90} className="h-full">
              <TiltCard className="h-full">
                <a
                  href={card.href}
                  {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={`group panel relative flex h-full items-center gap-5 overflow-hidden rounded-3xl p-6 transition-colors duration-500 sm:gap-6 sm:p-8 ${card.border}`}
                >
                  <div
                    className={`pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full blur-3xl ${card.glow}`}
                  />
                  <span
                    className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:scale-110 sm:h-16 sm:w-16 ${card.iconBox}`}
                  >
                    <card.icon className="h-7 w-7" />
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <h2 className="font-display text-base font-bold text-white sm:text-xl">
                      {card.title}
                    </h2>
                    <p className="mt-1 truncate text-sm text-zinc-400 sm:text-base">{card.value}</p>
                  </span>
                  <ArrowUpRight className="relative h-5 w-5 shrink-0 text-zinc-500 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white" />
                </a>
              </TiltCard>
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

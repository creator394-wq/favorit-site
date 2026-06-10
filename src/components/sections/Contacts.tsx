import { ArrowUpRight, Mail, MessageCircle, Phone, Send } from 'lucide-react'
import { contacts } from '../../data/contacts'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

const cards = [
  {
    icon: Phone,
    title: 'Телефон',
    value: contacts.phoneDisplay,
    href: contacts.phoneHref,
    external: false,
    accent: 'group-hover:border-accent-500/40',
    iconBg: 'bg-accent-500/15 text-accent-400',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    value: 'Написать в WhatsApp',
    href: contacts.whatsapp,
    external: true,
    accent: 'group-hover:border-emerald-400/40',
    iconBg: 'bg-emerald-400/15 text-emerald-400',
  },
  {
    icon: Send,
    title: 'Telegram',
    value: 'Написать в Telegram',
    href: contacts.telegram,
    external: true,
    accent: 'group-hover:border-sky-400/40',
    iconBg: 'bg-sky-400/15 text-sky-400',
  },
  {
    icon: Mail,
    title: 'Email',
    value: contacts.email,
    href: `mailto:${contacts.email}`,
    external: false,
    accent: 'group-hover:border-amber-400/40',
    iconBg: 'bg-amber-400/15 text-amber-400',
  },
]

export function Contacts() {
  return (
    <section id="contacts" className="relative overflow-hidden py-24 lg:py-32">
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-accent-500/8 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            badge="Контакты"
            title="Связаться с нами"
            subtitle="Только прямой контакт — позвоните или напишите менеджеру, ответим оперативно."
          />
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 100}>
              <a
                href={card.href}
                {...(card.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className={`group glass flex h-full flex-col rounded-3xl p-7 transition-all duration-500 hover:-translate-y-2 ${card.accent} lg:p-8`}
              >
                <span
                  className={`flex h-13 w-13 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110 ${card.iconBg}`}
                >
                  <card.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-lg font-bold text-white">{card.title}</h3>
                <p className="mt-2 flex-1 text-sm text-zinc-400">{card.value}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-300 transition-colors duration-300 group-hover:text-white">
                  Открыть
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

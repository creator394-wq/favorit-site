import { Mail, MessageCircle, Phone, Send } from 'lucide-react'
import { company, contacts } from '../data/contacts'

const navLinks = [
  { label: 'Главная', href: '#home' },
  { label: 'Опт', href: '#opt' },
  { label: 'Заправки', href: '#azs' },
  { label: 'Транспорт', href: '#transport' },
  { label: 'О компании', href: '#about' },
  { label: 'Контакты', href: '#contacts' },
]

const contactLinks = [
  { icon: Phone, label: contacts.phoneDisplay, href: contacts.phoneHref, external: false },
  { icon: MessageCircle, label: 'WhatsApp', href: contacts.whatsapp, external: true },
  { icon: Send, label: 'Telegram', href: contacts.telegram, external: true },
  { icon: Mail, label: contacts.email, href: `mailto:${contacts.email}`, external: false },
]

export function Footer() {
  return (
    <footer className="relative border-t border-white/8 py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <a href="#home" className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center">
                <span className="absolute inset-0 rotate-45 rounded-lg bg-gradient-to-br from-accent-500 to-flame-600" />
                <span className="font-display relative text-sm font-bold text-white">Ф</span>
              </span>
              <span className="font-display text-base font-bold tracking-wide text-white">
                ФАВОРИТ
              </span>
            </a>
            <p className="mt-5 text-sm leading-relaxed text-zinc-500">
              {company.name}
              <br />
              ИНН {company.inn}
            </p>
          </div>

          <nav className="grid grid-cols-2 content-start gap-x-6 gap-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-400 transition-colors duration-300 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="space-y-3">
            {contactLinks.map(({ icon: Icon, label, href, external }) => (
              <a
                key={label}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="flex items-center gap-3 text-sm text-zinc-400 transition-colors duration-300 hover:text-white"
              >
                <Icon className="h-4 w-4 text-accent-400" />
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/6 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {company.name}. Все права защищены.
          </span>
          <span>СУГ · Нефтепродукты · АЗС · Транспортные услуги</span>
        </div>
      </div>
    </footer>
  )
}

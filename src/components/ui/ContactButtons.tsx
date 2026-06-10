import { MessageCircle, Phone, Send } from 'lucide-react'
import { contacts } from '../../data/contacts'

interface ContactButtonsProps {
  size?: 'md' | 'lg'
  className?: string
}

export function ContactButtons({ size = 'md', className = '' }: ContactButtonsProps) {
  const base =
    'group inline-flex items-center justify-center gap-2.5 rounded-xl font-semibold transition-all duration-300 ' +
    (size === 'lg' ? 'px-7 py-4 text-base' : 'px-5 py-3 text-sm')

  return (
    <div className={`flex flex-wrap items-center gap-3 sm:gap-4 ${className}`}>
      <a
        href={contacts.phoneHref}
        className={`${base} bg-gradient-to-r from-accent-600 to-flame-600 text-white shadow-lg shadow-accent-500/20 hover:shadow-accent-500/45 hover:-translate-y-0.5`}
      >
        <Phone className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-12" />
        Позвонить менеджеру
      </a>
      <a
        href={contacts.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} glass text-zinc-100 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:-translate-y-0.5`}
      >
        <MessageCircle className="h-4.5 w-4.5 text-emerald-400" />
        WhatsApp
      </a>
      <a
        href={contacts.telegram}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} glass text-zinc-100 hover:border-sky-400/40 hover:bg-sky-400/10 hover:-translate-y-0.5`}
      >
        <Send className="h-4.5 w-4.5 text-sky-400" />
        Telegram
      </a>
    </div>
  )
}

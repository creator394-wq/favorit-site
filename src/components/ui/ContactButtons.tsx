import { MessageCircle, Phone, Send } from 'lucide-react'
import { contacts } from '../../data/contacts'

interface ContactButtonsProps {
  size?: 'md' | 'lg'
  className?: string
}

export function ContactButtons({ size = 'md', className = '' }: ContactButtonsProps) {
  const base =
    'inline-flex items-center justify-center gap-2.5 font-semibold transition-colors duration-300 ' +
    (size === 'lg' ? 'px-7 py-4 text-base' : 'px-5 py-3 text-sm')

  return (
    <div className={`flex flex-wrap items-center gap-3 sm:gap-4 ${className}`}>
      <a
        href={contacts.phoneHref}
        className={`${base} bg-accent-500 text-graphite-950 hover:bg-accent-400`}
      >
        <Phone className="h-4.5 w-4.5" />
        Позвонить менеджеру
      </a>
      <a
        href={contacts.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} border border-white/20 text-zinc-100 hover:border-white/50`}
      >
        <MessageCircle className="h-4.5 w-4.5" />
        WhatsApp
      </a>
      <a
        href={contacts.telegram}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} border border-white/20 text-zinc-100 hover:border-white/50`}
      >
        <Send className="h-4.5 w-4.5" />
        Telegram
      </a>
    </div>
  )
}

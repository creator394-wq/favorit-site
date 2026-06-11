import { MessageCircle, Phone, Send } from 'lucide-react'
import { contacts } from '../../data/contacts'
import { Magnetic } from '../motion/Magnetic'

interface ContactButtonsProps {
  size?: 'md' | 'lg'
  className?: string
  /** Обернуть кнопки в магнитный hover-эффект */
  magnetic?: boolean
}

export function ContactButtons({ size = 'md', className = '', magnetic = false }: ContactButtonsProps) {
  const base =
    'inline-flex items-center justify-center gap-2.5 font-semibold transition-colors duration-300 ' +
    (size === 'lg' ? 'px-7 py-4 text-base' : 'px-5 py-3 text-sm')

  const wrap = (key: string, node: React.ReactNode) =>
    magnetic ? <Magnetic key={key}>{node}</Magnetic> : node

  return (
    <div className={`flex flex-wrap items-center gap-3 sm:gap-4 ${className}`}>
      {wrap(
        'phone',
        <a
          key="phone"
          href={contacts.phoneHref}
          className={`${base} bg-accent-500 text-graphite-950 hover:bg-accent-400`}
        >
          <Phone className="h-4.5 w-4.5" />
          Позвонить менеджеру
        </a>,
      )}
      {wrap(
        'wa',
        <a
          key="wa"
          href={contacts.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} border border-white/20 text-zinc-100 hover:border-white/50`}
        >
          <MessageCircle className="h-4.5 w-4.5" />
          WhatsApp
        </a>,
      )}
      {wrap(
        'tg',
        <a
          key="tg"
          href={contacts.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} border border-white/20 text-zinc-100 hover:border-white/50`}
        >
          <Send className="h-4.5 w-4.5" />
          Telegram
        </a>,
      )}
    </div>
  )
}

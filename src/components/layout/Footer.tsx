import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MessageCircle, Phone, Send } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../../lib/gsap'
import { company, contacts } from '../../data/contacts'
import { navItems } from '../../config/nav'
import { Logo } from './Navbar'

export function Footer() {
  const root = useRef<HTMLElement>(null)

  /* wordmark «выплывает» из-под нижней кромки при подходе к футеру */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '[data-wordmark]',
        { yPercent: 36 },
        {
          yPercent: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top bottom',
            end: 'top 45%',
            scrub: true,
          },
        },
      )
    },
    { scope: root },
  )

  return (
    <footer ref={root} className="mt-28 overflow-hidden border-t border-white/10 bg-graphite-900/50">
      {/* типографический аккорд */}
      <div
        data-wordmark
        aria-hidden="true"
        className="font-display pointer-events-none -mb-[0.21em] text-center text-[19vw] leading-none font-bold tracking-tight whitespace-nowrap text-white/[0.04] select-none will-change-transform"
      >
        ФАВОРИТ
      </div>
      <div className="border-t border-white/8" />
      <div className="mx-auto w-full max-w-7xl px-5 pt-16 pb-8 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-zinc-500">
              Оптовые поставки СУГ и нефтепродуктов, автозаправочные станции и
              транспортные услуги для бизнеса.
            </p>
            <p className="mt-5 text-xs text-zinc-600">
              {company.name} · ИНН {company.inn} · работаем с {company.sinceYear} года
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              Разделы
            </h3>
            <ul className="mt-4 space-y-2.5">
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-zinc-400 transition-colors duration-300 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              Связаться
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href={contacts.phoneHref}
                  className="flex items-center gap-2.5 text-sm text-zinc-400 transition-colors duration-300 hover:text-white"
                >
                  <Phone className="h-4 w-4 text-zinc-500" />
                  {contacts.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={contacts.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-zinc-400 transition-colors duration-300 hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 text-zinc-500" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={contacts.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-zinc-400 transition-colors duration-300 hover:text-white"
                >
                  <Send className="h-4 w-4 text-zinc-500" />
                  Telegram
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contacts.email}`}
                  className="flex items-center gap-2.5 text-sm text-zinc-400 transition-colors duration-300 hover:text-white"
                >
                  <Mail className="h-4 w-4 text-zinc-500" />
                  {contacts.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {company.name}. Все права защищены.
          </span>
          <span>СУГ · Нефтепродукты · АЗС · Транспортные услуги</span>
        </div>
      </div>
    </footer>
  )
}

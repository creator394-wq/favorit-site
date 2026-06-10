import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, Phone, X } from 'lucide-react'
import { contacts } from '../../data/contacts'
import { ContactButtons } from '../ui/ContactButtons'

export const navItems = [
  { to: '/', label: 'Главная' },
  { to: '/wholesale', label: 'Опт' },
  { to: '/stations', label: 'Заправки' },
  { to: '/transport', label: 'Транспорт' },
  { to: '/about', label: 'О компании' },
  { to: '/contacts', label: 'Контакты' },
]

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className="group flex items-center gap-3">
      <span className="relative flex h-10 w-10 rotate-45 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent-500 to-flame-600 shadow-lg shadow-accent-500/30 transition-transform duration-500 group-hover:rotate-[135deg]">
        <span className="font-display -rotate-45 text-base font-bold text-white transition-transform duration-500 group-hover:rotate-[-135deg]">
          Ф
        </span>
      </span>
      <span className="leading-none">
        <span className="font-display block text-lg font-bold tracking-wide text-white">
          ФАВОРИТ
        </span>
        <span className="mt-1 block text-[10px] font-semibold tracking-[0.3em] text-zinc-500 uppercase">
          Топливо · СУГ · АЗС
        </span>
      </span>
    </Link>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // блокируем прокрутку под полноэкранным меню
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/8 bg-graphite-950/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    <span
                      className={`absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-accent-500 to-flame-600 transition-all duration-300 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={contacts.phoneHref}
              className="hidden items-center gap-2.5 rounded-full bg-gradient-to-r from-accent-600 to-flame-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-500/25 transition-all duration-300 hover:shadow-accent-500/50 md:inline-flex"
            >
              <Phone className="h-4 w-4" />
              {contacts.phoneDisplay}
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Открыть меню"
              className="glass flex h-11 w-11 items-center justify-center rounded-xl text-white transition-colors duration-300 hover:border-accent-500/40 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* полноэкранное мобильное меню */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col bg-graphite-950/95 backdrop-blur-2xl transition-all duration-500 lg:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-accent-500/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-24 h-80 w-80 rounded-full bg-gas-500/8 blur-3xl" />

        <div className="relative flex h-20 items-center justify-between px-5 sm:px-8">
          <Logo onClick={() => setOpen(false)} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
            className="glass flex h-11 w-11 items-center justify-center rounded-xl text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          className="relative flex flex-1 flex-col justify-center gap-1 px-7 sm:px-10"
          aria-label="Мобильная навигация"
        >
          {open &&
            navItems.map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${80 + i * 60}ms` }}
                className={({ isActive }) =>
                  `menu-item-in font-display flex items-center gap-4 py-3 text-3xl font-bold tracking-wide transition-colors duration-300 sm:text-4xl ${
                    isActive ? 'text-gradient-fire' : 'text-zinc-300 hover:text-white'
                  }`
                }
              >
                <span className="text-sm font-semibold text-zinc-600">
                  0{i + 1}
                </span>
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="relative px-7 pb-10 sm:px-10">
          {open && (
            <div className="menu-item-in" style={{ animationDelay: '480ms' }}>
              <ContactButtons />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

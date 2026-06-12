import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, Phone, X } from 'lucide-react'
import { contacts } from '../../data/contacts'
import { navItems } from '../../config/nav'
import { ContactButtons } from '../ui/ContactButtons'
import { Magnetic } from '../motion/Magnetic'
import { lenis } from '../motion/SmoothScroll'

/** Логотип бренда «Фаворит Сервис»: реальный прозрачный PNG. */
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-3">
      <img
        src="/assets/logo-favorit-service.png"
        alt="Фаворит Сервис"
        className="h-12 w-auto sm:h-14"
      />
      <span className="leading-none">
        <span className="block text-[10px] font-medium tracking-[0.28em] text-zinc-500 uppercase">
          СУГ · Нефтепродукты · АЗС
        </span>
      </span>
    </Link>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      // premium-паттерн: шапка прячется при скролле вниз, возвращается при скролле вверх
      setHidden(y > 140 && y > lastY)
      lastY = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // блокируем прокрутку под полноэкранным меню (включая Lenis)
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) lenis?.stop()
    else lenis?.start()
    return () => {
      document.body.style.overflow = ''
      lenis?.start()
    }
  }, [open])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,transform] duration-500 ${
          hidden && !open ? '-translate-y-full' : 'translate-y-0'
        } ${
          scrolled
            ? 'border-b border-white/10 bg-graphite-950/95 backdrop-blur-sm'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <Logo />

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Основная навигация">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group/nav relative py-2 text-sm font-medium transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {/* активная линия + hover-линия, растущая слева */}
                    <span
                      className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-accent-500 transition-transform duration-300 ease-out ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Magnetic className="hidden md:inline-block">
              <a
                href={contacts.phoneHref}
                className="inline-flex items-center gap-2.5 border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:border-accent-500 hover:text-accent-400"
              >
                <Phone className="h-4 w-4" />
                {contacts.phoneDisplay}
              </a>
            </Magnetic>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Открыть меню"
              className="flex h-11 w-11 items-center justify-center border border-white/15 text-white transition-colors duration-300 hover:border-accent-500 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* полноэкранное мобильное меню */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col bg-graphite-950/98 backdrop-blur-sm transition-opacity duration-400 lg:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="flex h-20 items-center justify-between px-5 sm:px-8">
          <Logo onClick={() => setOpen(false)} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
            className="flex h-11 w-11 items-center justify-center border border-white/15 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          className="flex flex-1 flex-col justify-center px-7 sm:px-10"
          aria-label="Мобильная навигация"
        >
          {open &&
            navItems.map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${60 + i * 50}ms` }}
                className={({ isActive }) =>
                  `menu-item-in font-display flex items-baseline gap-4 border-b border-white/8 py-4 text-3xl font-semibold tracking-tight transition-colors duration-300 sm:text-4xl ${
                    isActive ? 'text-accent-400' : 'text-zinc-200 hover:text-white'
                  }`
                }
              >
                <span className="text-xs font-medium text-zinc-600">0{i + 1}</span>
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="px-7 pb-10 sm:px-10">
          {open && (
            <div className="menu-item-in" style={{ animationDelay: '420ms' }}>
              <ContactButtons />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

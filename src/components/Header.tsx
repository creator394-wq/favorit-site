import { useEffect, useState } from 'react'
import { Menu, Phone, X } from 'lucide-react'
import { contacts } from '../data/contacts'

const navLinks = [
  { label: 'Главная', href: '#home' },
  { label: 'Опт', href: '#opt' },
  { label: 'Заправки', href: '#azs' },
  { label: 'Транспорт', href: '#transport' },
  { label: 'О компании', href: '#about' },
  { label: 'Контакты', href: '#contacts' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/8 bg-graphite-950/80 backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#home" className="group flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center">
            <span className="absolute inset-0 rotate-45 rounded-lg bg-gradient-to-br from-accent-500 to-flame-600 transition-transform duration-500 group-hover:rotate-[135deg]" />
            <span className="font-display relative text-sm font-bold text-white">Ф</span>
          </span>
          <span className="leading-tight">
            <span className="font-display block text-base font-bold tracking-wide text-white">
              ФАВОРИТ
            </span>
            <span className="block text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
              топливо · СУГ · АЗС
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors duration-300 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <a
            href={contacts.phoneHref}
            className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-accent-600 to-flame-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/20 transition-all duration-300 hover:shadow-accent-500/45 hover:-translate-y-0.5"
          >
            <Phone className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            {contacts.phoneDisplay}
          </a>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setMenuOpen((v) => !v)}
          className="glass flex h-11 w-11 items-center justify-center rounded-xl text-white lg:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={`overflow-hidden border-b border-white/8 bg-graphite-950/95 backdrop-blur-xl transition-all duration-500 lg:hidden ${
          menuOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1 px-5 py-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-base font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <a
            href={contacts.phoneHref}
            className="mt-2 inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-accent-600 to-flame-600 px-5 py-3.5 text-sm font-semibold text-white"
          >
            <Phone className="h-4 w-4" />
            {contacts.phoneDisplay}
          </a>
        </nav>
      </div>
    </header>
  )
}

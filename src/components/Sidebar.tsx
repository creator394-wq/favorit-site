import { NavLink } from 'react-router-dom'
import {
  Building2,
  Fuel,
  Newspaper,
  Package,
  Phone,
  PhoneCall,
  Truck,
} from 'lucide-react'
import { company, contacts } from '../data/contacts'

export const navItems = [
  { to: '/', label: 'Новости', icon: Newspaper },
  { to: '/wholesale', label: 'Опт', icon: Package },
  { to: '/stations', label: 'Заправки', icon: Fuel },
  { to: '/transport', label: 'Транспорт', icon: Truck },
  { to: '/about', label: 'О компании', icon: Building2 },
  { to: '/contacts', label: 'Контакты', icon: Phone },
]

export function Logo() {
  return (
    <NavLink to="/" className="group flex items-center gap-3">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
        <span className="absolute inset-0 rotate-45 rounded-lg bg-gradient-to-br from-accent-500 to-flame-600 shadow-lg shadow-accent-500/30 transition-transform duration-500 group-hover:rotate-[135deg]" />
        <span className="font-display relative text-sm font-bold text-white">Ф</span>
      </span>
      <span className="leading-tight">
        <span className="font-display block text-base font-bold tracking-wide text-white">
          ФАВОРИТ
        </span>
        <span className="block text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
          топливо · СУГ · АЗС
        </span>
      </span>
    </NavLink>
  )
}

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-accent-500/15 to-transparent text-white'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`absolute left-0 h-6 w-0.5 rounded-full bg-gradient-to-b from-accent-400 to-flame-600 transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <Icon
                className={`h-4.5 w-4.5 transition-colors duration-300 ${
                  isActive ? 'text-accent-400' : 'text-zinc-500 group-hover:text-zinc-300'
                }`}
              />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/8 bg-graphite-900/70 backdrop-blur-xl lg:flex">
      <div className="px-5 pt-6 pb-7">
        <Logo />
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <NavList />
      </div>

      <div className="space-y-3 border-t border-white/8 p-4">
        <a
          href={contacts.phoneHref}
          className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-accent-600 to-flame-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/20 transition-all duration-300 hover:shadow-accent-500/40"
        >
          <PhoneCall className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
          <span className="truncate">{contacts.phoneDisplay}</span>
        </a>
        <p className="px-1 text-[11px] leading-relaxed text-zinc-600">
          {company.name}
          <br />
          ИНН {company.inn}
        </p>
      </div>
    </aside>
  )
}

import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { company, contacts } from '../data/contacts'
import { Logo, NavList, Sidebar } from './Sidebar'

function MobileBar({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-graphite-950/85 px-4 backdrop-blur-xl lg:hidden">
      <Logo />
      <button
        type="button"
        aria-label="Открыть меню"
        onClick={onOpen}
        className="glass flex h-10 w-10 items-center justify-center rounded-xl text-white"
      >
        <Menu className="h-5 w-5" />
      </button>
    </header>
  )
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-graphite-900 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-6">
          <Logo />
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={onClose}
            className="glass flex h-9 w-9 items-center justify-center rounded-lg text-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <NavList onNavigate={onClose} />
        </div>
        <div className="border-t border-white/8 p-4">
          <a
            href={contacts.phoneHref}
            className="flex items-center justify-center rounded-xl bg-gradient-to-r from-accent-600 to-flame-600 px-4 py-3 text-sm font-semibold text-white"
          >
            {contacts.phoneDisplay}
          </a>
        </div>
      </div>
    </div>
  )
}

export function PortalLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    setDrawerOpen(false)
  }, [pathname])

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="bg-grid pointer-events-none fixed inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -top-48 right-0 h-[460px] w-[620px] rounded-full bg-accent-500/7 blur-[150px]" />

      <Sidebar />
      <MobileBar onOpen={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="relative flex min-h-screen flex-col pt-16 lg:pt-0 lg:pl-64">
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <Outlet />
        </main>

        <footer className="mt-auto border-t border-white/6 py-6 lg:ml-0">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
            <span>
              © {new Date().getFullYear()} {company.name} · ИНН {company.inn}
            </span>
            <span>СУГ · Нефтепродукты · АЗС · Транспортные услуги</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

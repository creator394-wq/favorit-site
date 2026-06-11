import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { SmoothScroll, lenis } from '../motion/SmoothScroll'
import { ScrollProgress } from '../motion/ScrollProgress'
import { Cursor } from '../motion/Cursor'
import { ScrollTrigger } from '../../lib/gsap'

const EASE = [0.76, 0, 0.24, 1] as const

/** Контент страницы: мягкий fade под шторкой. */
const pageVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.35, delay: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.3, delay: 0.15 } },
}

/**
 * Кино-шторка: на выходе поднимается снизу и закрывает кадр,
 * на входе уходит вверх, открывая новую страницу.
 */
const curtainVariants = {
  initial: { scaleY: 1 },
  enter: {
    scaleY: 0,
    transition: { duration: 0.6, ease: EASE },
    transitionEnd: { display: 'none' },
  },
  exit: {
    scaleY: 1,
    display: 'block',
    transition: { duration: 0.45, ease: EASE },
  },
}

export function SiteLayout() {
  const { pathname } = useLocation()
  const outlet = useOutlet()

  const onExitComplete = () => {
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }

  return (
    <SmoothScroll>
      <div className="relative min-h-screen overflow-x-clip bg-graphite-950">
        <ScrollProgress />
        <Navbar />
        <main>
          <AnimatePresence mode="wait" initial={false} onExitComplete={onExitComplete}>
            <motion.div key={pathname} initial="initial" animate="enter" exit="exit">
              {/* шторка перехода */}
              <motion.div
                variants={curtainVariants}
                style={{ originY: 1 }}
                className="pointer-events-none fixed inset-0 z-[65] bg-graphite-850"
              >
                <span className="absolute inset-x-0 top-0 h-px bg-accent-500" />
              </motion.div>

              <motion.div variants={pageVariants}>
                {outlet}
                <Footer />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </main>
        <Cursor />
        <div className="film-grain" aria-hidden="true" />
      </div>
    </SmoothScroll>
  )
}

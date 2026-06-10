import { Factory, Fuel, Truck } from 'lucide-react'

const stages = [
  { icon: Factory, title: 'Источник', caption: 'СУГ и нефтепродукты оптовыми партиями' },
  { icon: Truck, title: 'Транспорт', caption: 'Перевозка по согласованным маршрутам' },
  { icon: Fuel, title: 'АЗС / Клиент', caption: 'Поставка на объект или продажа на АЗС' },
]

/**
 * Динамическая схема движения топлива: источник → транспорт → АЗС/клиент.
 * Линии «текут» (бегущий пунктир + светящаяся точка).
 */
export function FuelFlow() {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-0">
      {stages.map((stage, i) => (
        <div key={stage.title} className="contents">
          {i > 0 && (
            <>
              <div className="flow-line-v mx-auto h-14 sm:hidden">
                <span className="flow-dot" />
              </div>
              <div className="flow-line mx-2 hidden min-w-10 flex-1 sm:block lg:mx-4">
                <span className="flow-dot" />
              </div>
            </>
          )}
          <div className="panel relative shrink-0 rounded-3xl px-6 py-6 text-center sm:w-52 lg:w-60 lg:px-7 lg:py-8">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 rounded-2xl bg-accent-500/12" />
              <span className="absolute inset-0 rounded-2xl border border-accent-500/30 animate-pulse-glow" />
              <stage.icon className="relative h-7 w-7 text-accent-400" />
            </div>
            <h3 className="font-display mt-4 text-base font-bold text-white">{stage.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 sm:text-[13px]">
              {stage.caption}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

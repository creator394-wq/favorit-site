import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

// URL API заявок. На проде (Vercel) — relative /api/lead (serverless function).
// Локально под bot API задайте VITE_LEAD_API_URL=http://localhost:8787/api/lead.
const LEAD_API_URL =
  (import.meta.env as Record<string, string | undefined>).VITE_LEAD_API_URL || '/api/lead'

type Status = 'idle' | 'sending' | 'done' | 'error'

export function LeadForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      setStatus('error')
      return
    }
    setStatus('sending')
    try {
      const res = await fetch(LEAD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, message }),
      })
      const data = await res.json()
      if (data?.success) {
        setStatus('done')
        setName('')
        setPhone('')
        setMessage('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const inputCls =
    'w-full border border-white/10 bg-graphite-900/60 px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-colors duration-300 focus:border-accent-500/60 focus:outline-none'

  if (status === 'done') {
    return (
      <div className="border border-accent-500/30 bg-graphite-900/60 p-8 text-center">
        <p className="font-display text-xl font-bold text-white">Спасибо!</p>
        <p className="mt-2 text-sm text-zinc-400">Мы свяжемся с вами в ближайшее время.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-white/10 bg-graphite-900/40 p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Получить консультацию
      </h2>
      <div className="mt-6 grid gap-4">
        <input
          className={inputCls}
          type="text"
          placeholder="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className={inputCls}
          type="tel"
          placeholder="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <textarea
          className={`${inputCls} min-h-24 resize-y`}
          placeholder="Комментарий"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {status === 'error' && (
        <p className="mt-3 text-sm text-accent-400">
          Укажите имя и телефон и попробуйте ещё раз.
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="group mt-5 inline-flex items-center gap-2.5 bg-accent-500 px-7 py-4 text-sm font-semibold text-graphite-950 transition-colors duration-300 hover:bg-accent-400 disabled:opacity-60 sm:text-base"
      >
        {status === 'sending' ? 'Отправка…' : 'Отправить заявку'}
        <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </form>
  )
}

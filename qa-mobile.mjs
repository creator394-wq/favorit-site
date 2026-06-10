import { chromium } from 'playwright-core'
import fs from 'node:fs'

const OUT = '/tmp/favorit-shots'
fs.mkdirSync(OUT, { recursive: true })
const URL = 'http://localhost:5180/'
const browser = await chromium.launch({ channel: 'chrome' })

const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})
await page.goto(URL, { waitUntil: 'networkidle' })
await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto'
  const h = document.body.scrollHeight
  for (let y = 0; y <= h; y += 350) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 50))
  }
  window.scrollTo(0, 0)
})
await page.waitForTimeout(800)

const targets = ['#home', '#opt', '#azs', '#transport', '#about', '#contacts']
for (const sel of targets) {
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView(), sel)
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/m-${sel.slice(1)}.png` })
}

// directions cards (between hero and opt)
await page.evaluate(() => window.scrollTo(0, document.querySelector('#opt').offsetTop - 1400))
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/m-directions.png` })

// menu open at top
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(400)
await page.click('button[aria-label="Открыть меню"]')
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/m-menu.png` })

// horizontal overflow check
const overflow = await page.evaluate(() => {
  const docW = document.documentElement.clientWidth
  const bad = []
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && (r.right > docW + 1 || r.left < -1)) {
      bad.push(`${el.tagName}.${[...el.classList].slice(0, 3).join('.')} right=${Math.round(r.right)} left=${Math.round(r.left)}`)
    }
  })
  return { docW, scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 12) }
})
console.log(JSON.stringify(overflow, null, 2))

await browser.close()
console.log('done')

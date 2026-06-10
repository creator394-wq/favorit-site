import { chromium } from 'playwright-core'
import fs from 'node:fs'

const OUT = '/tmp/favorit-shots'
fs.mkdirSync(OUT, { recursive: true })

const URL = 'http://localhost:5180/'
const browser = await chromium.launch({ channel: 'chrome' })

async function revealAll(page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto'
    const h = document.body.scrollHeight
    for (let y = 0; y <= h; y += 350) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(900)
}

async function shoot(name, viewport, actions) {
  const page = await browser.newPage({ viewport })
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await revealAll(page)
  if (actions) await actions(page)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: !actions })
  await page.close()
}

// full page overviews
await shoot('desktop-full', { width: 1440, height: 900 })
await shoot('tablet-full', { width: 834, height: 1112 })
await shoot('mobile-full', { width: 390, height: 844 })

// desktop section details (viewport shots)
const sections = ['#home', '#opt', '#azs', '#transport', '#about', '#contacts']
for (const sel of sections) {
  await shoot(`desktop-${sel.slice(1)}`, { width: 1440, height: 900 }, async (page) => {
    await page.evaluate((s) => {
      document.documentElement.style.scrollBehavior = 'auto'
      document.querySelector(s)?.scrollIntoView()
    }, sel)
    await page.waitForTimeout(900)
  })
}

// mobile menu open
await shoot('mobile-menu', { width: 390, height: 844 }, async (page) => {
  await page.click('button[aria-label="Открыть меню"]')
  await page.waitForTimeout(700)
})

// mobile azs detail
await shoot('mobile-azs', { width: 390, height: 844 }, async (page) => {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
    document.querySelector('#azs')?.scrollIntoView()
  })
  await page.waitForTimeout(900)
})

await browser.close()
console.log('done:', fs.readdirSync(OUT).join(', '))

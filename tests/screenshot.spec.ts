import { test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TEST_DATA = path.resolve(__dirname, '../vacation-schedule-test-data.json')

test('screenshot month view', async ({ page }) => {
  await page.goto('/')
  await page.setViewportSize({ width: 1400, height: 900 })

  await page.getByTitle('Экспорт/Импорт').click()
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(TEST_DATA)
  await page.getByRole('button', { name: 'Импортировать' }).click()
  await page.locator('.gantt-bar').first().waitFor({ timeout: 10000 })

  // Switch to month scale
  const scaleButton = page.locator('button', { hasText: /День|Неделя|Месяц/ }).first()
  await scaleButton.click()
  await page.getByRole('menuitem', { name: 'Месяц' }).click()
  await page.waitForTimeout(600)

  // Scroll chart to July (densest area) — ~200 days * 4px/day = 800px
  const chartScroll = page.locator('.flex-1.overflow-auto').last()
  await chartScroll.evaluate((el) => { el.scrollLeft = 750 })
  await page.waitForTimeout(200)

  await page.screenshot({ path: 'tests/month-view.png', fullPage: false })
})

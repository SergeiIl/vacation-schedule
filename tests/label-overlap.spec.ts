import { test, expect } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TEST_DATA = path.resolve(__dirname, '../vacation-schedule-test-data.json')

test('no date label overlaps in month view', async ({ page }) => {
  await page.goto('/')

  // Open Export/Import panel
  await page.getByTitle('Экспорт/Импорт').click()

  // Upload test data via hidden file input
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(TEST_DATA)

  // Confirm import dialog
  await page.getByRole('button', { name: 'Импортировать' }).click()

  // Wait for employees to appear
  await expect(page.locator('.gantt-bar').first()).toBeVisible({ timeout: 10000 })

  // Switch to month scale via scale dropdown in header
  // Find the scale button — it shows the current scale label
  const scaleButton = page.locator('button', { hasText: /День|Неделя|Месяц/ }).first()
  await scaleButton.click()
  await page.getByRole('menuitem', { name: 'Месяц' }).click()

  // Wait for bars to re-render
  await page.waitForTimeout(500)

  // Collect all outside date label bounding boxes
  // Outside labels are spans with whitespace-nowrap that are siblings of .gantt-bar
  // They live in each GanttRow's relative div, outside the bar div
  const labelBBoxes = await page.evaluate(() => {
    const labels = Array.from(
      document.querySelectorAll<HTMLSpanElement>(
        'span.absolute.whitespace-nowrap.pointer-events-none.select-none',
      ),
    )
    return labels.map((el) => {
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, text: el.textContent ?? '' }
    })
  })

  // Check no two labels overlap
  const overlaps: string[] = []
  for (let i = 0; i < labelBBoxes.length; i++) {
    for (let j = i + 1; j < labelBBoxes.length; j++) {
      const a = labelBBoxes[i]
      const b = labelBBoxes[j]
      const horizontalOverlap = a.left < b.right && a.right > b.left
      const verticalOverlap = a.top < b.bottom && a.bottom > b.top
      if (horizontalOverlap && verticalOverlap) {
        overlaps.push(`"${a.text}" (${a.left.toFixed(0)}-${a.right.toFixed(0)}) перекрывается с "${b.text}" (${b.left.toFixed(0)}-${b.right.toFixed(0)})`)
      }
    }
  }

  if (overlaps.length > 0) {
    console.log('Найдены наложения:')
    overlaps.forEach((o) => console.log(' ', o))
  }

  expect(overlaps.length, `Найдено ${overlaps.length} наложений подписей: ${overlaps.slice(0, 5).join('; ')}`).toBe(0)
})

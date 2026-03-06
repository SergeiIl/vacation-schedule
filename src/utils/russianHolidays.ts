export interface RussianHoliday {
  name: string
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
}

function d(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function extra(year: number, month: number, day: number, label: string): RussianHoliday {
  const s = d(year, month, day)
  return { name: label, start: s, end: s }
}

/**
 * Returns Russian public holidays for the given year.
 * Base holidays per Art. 112 of the Labour Code (ТК РФ) plus
 * official transfer days (переносы) for 2024–2027.
 *
 * Transfer days for 2026–2027 are approximate — verify against
 * the official government decree (Постановление Правительства РФ).
 */
export function getRussianHolidays(year: number): RussianHoliday[] {
  const base: RussianHoliday[] = [
    { name: 'Новогодние каникулы / Рождество', start: d(year, 1, 1), end: d(year, 1, 8) },
    { name: 'День защитника Отечества',        start: d(year, 2, 23), end: d(year, 2, 23) },
    { name: 'Международный женский день',       start: d(year, 3, 8),  end: d(year, 3, 8) },
    { name: 'Праздник весны и труда',           start: d(year, 5, 1),  end: d(year, 5, 1) },
    { name: 'День Победы',                      start: d(year, 5, 9),  end: d(year, 5, 9) },
    { name: 'День России',                      start: d(year, 6, 12), end: d(year, 6, 12) },
    { name: 'День народного единства',          start: d(year, 11, 4), end: d(year, 11, 4) },
  ]
  return [...base, ...getAnnualTransfers(year)]
}

function getAnnualTransfers(year: number): RussianHoliday[] {
  // Sources: official government decrees (Постановление Правительства РФ)
  switch (year) {
    case 2024:
      // Постановление Правительства РФ от 10.08.2023 №1314
      return [
        extra(2024, 4, 29, 'Выходной день (перенос с 27.04)'),
        extra(2024, 4, 30, 'Выходной день (перенос с 27.04)'),
        extra(2024, 5, 10, 'Выходной день (перенос с 06.01)'),
        extra(2024, 11, 8, 'Выходной день (перенос с 02.11)'),
        extra(2024, 12, 31, 'Выходной день (перенос с 28.12)'),
      ]
    case 2025:
      // Постановление Правительства РФ от 31.07.2024 №1026
      return [
        extra(2025, 2, 24, 'Выходной день (перенос с 22.02)'),
        extra(2025, 3, 10, 'Выходной день (перенос с 22.03)'),
        extra(2025, 5, 2,  'Выходной день (перенос с 26.04)'),
        extra(2025, 5, 8,  'Выходной день (перенос с 11.01)'),
        extra(2025, 6, 13, 'Выходной день (перенос с 21.06)'),
        extra(2025, 11, 3, 'Выходной день (перенос с 01.11)'),
        extra(2025, 12, 31, 'Выходной день (перенос с 27.12)'),
      ]
    case 2026:
      // Постановление Правительства РФ от 24.09.2025 №1466
      return [
        extra(2026, 1, 9,   'Выходной день (перенос с 03.01)'),   // decree: сб 3.01 → пт 9.01
        extra(2026, 3, 9,   'Выходной день (перенос с 08.03)'),   // auto: вс 8.03 → пн 9.03
        extra(2026, 5, 11,  'Выходной день (перенос с 09.05)'),   // auto: сб 9.05 → пн 11.05
        extra(2026, 12, 31, 'Выходной день (перенос с 04.01)'),   // decree: вс 4.01 → чт 31.12
      ]
    case 2027:
      // Переносы приблизительные — уточните по постановлению Правительства РФ
      return [
        extra(2027, 5, 3,  'Выходной день (перенос с 01.05)'),
        extra(2027, 5, 10, 'Выходной день (перенос с 09.05)'),
        extra(2027, 6, 14, 'Выходной день (перенос с 12.06)'),
      ]
    default:
      return []
  }
}

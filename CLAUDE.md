# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite)
npm run build      # Type-check + build for production (tsc -b && vite build)
npm run lint       # ESLint
npm run preview    # Preview production build
```

No test suite is configured. TypeScript is the primary correctness tool — always run `npm run build` to verify changes.

## Architecture Overview

A single-page vacation scheduling app with a Gantt chart visualization. All data is stored in IndexedDB (no backend). The app is deployed under the `/vacation-schedule/` base path (configured in `vite.config.ts`).

### State Management (Zustand)

Three stores in `src/store/`:
- `employeeStore` — employees with their vacation intervals, NRD, unpaid leave; includes undo/redo (max 50 steps via `past`/`future` arrays). Every mutation calls the corresponding IndexedDB helper.
- `specialDateStore` — holidays and forbidden periods.
- `settingsStore` — planning year, scale (day/week/month), theme, row height, display toggles. Persisted to IndexedDB under key `'app-settings'`.

### Data Model

All dates are stored as ISO strings `"YYYY-MM-DD"` throughout the store and IndexedDB. Convert to `Date` only at point of use with `parseISO` from date-fns.

Each `Employee` has:
- `vacations: VacationInterval[]` — main annual leave (multiple periods)
- `nrd: NRD[]` — non-working days (нерабочие дни)
- `unpaidLeave: UnpaidLeave[]` — unpaid leave (отпуск за свой счёт)

`SpecialDate` has `type: 'holiday' | 'forbidden'` and optional `end` (null = single day).

### IndexedDB

Singleton pattern in `src/db/indexedDB.ts` — `getDB()` opens/creates the DB. Three object stores: `employees` (keyPath: `id`, indexes: `by-order`, `by-name`), `specialDates` (keyPath: `id`, index: `by-type`), `settings` (key-value, uses key `'app-settings'`).

### Gantt Chart

- `PIXELS_PER_DAY = { day: 32, week: 14, month: 4 }` in `src/utils/dateUtils.ts`
- Pixel position: `dateToPixel(date, chartStart, ppd)` = `differenceInCalendarDays(date, Jan1) * ppd`
- `GanttGrid` renders the background using `<canvas>` for performance
- Bars are built by `buildBarsForEmployee()` in `src/utils/ganttLayout.ts`
- Each `GanttBar` carries `employeeId`, `vacationId` (actually the interval id), and `type: 'vacation' | 'nrd' | 'unpaid'`

### Drag and Drop

`DnDHandler` (`src/components/gantt/DnDHandler.tsx`) is a React Context Provider wrapping the chart. Uses raw Pointer Events (not dnd-kit):
- `setPointerCapture` on the bar element at drag start
- `pointermove`/`pointerup` listeners on `window`
- Validates against forbidden periods and overlapping vacations via `isIntervalValid()` from `src/utils/validation.ts`
- Bar id in drag state is `"${employeeId}:${vacationId}"`

### UI Components

Shadcn-style components written manually in `src/components/ui/` — do NOT use the `shadcn CLI`. Add new UI primitives by hand following the existing pattern (Radix UI primitive + Tailwind + `class-variance-authority`).

### TypeScript

Strict mode with `noUnusedLocals: true`. All unused imports must be removed or the build fails. Path alias `@` maps to `src/`.

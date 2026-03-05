import * as React from 'react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DateRange } from 'react-day-picker'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface DateRangePickerProps {
  start: string
  end: string
  onChange: (start: string, end: string) => void
  className?: string
}

export function DateRangePicker({
  start,
  end,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selecting, setSelecting] = React.useState<DateRange | undefined>(
    undefined,
  )

  const committed: DateRange | undefined =
    start && end ? { from: parseISO(start), to: parseISO(end) } : undefined

  const displayed = selecting ?? committed

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) return
    setSelecting(range)
    if (range.from && range.to) {
      onChange(format(range.from, 'yyyy-MM-dd'), format(range.to, 'yyyy-MM-dd'))
      setSelecting(undefined)
      setOpen(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelecting(undefined)
    setOpen(next)
  }

  const label =
    committed?.from && committed?.to
      ? `${format(committed.from, 'd MMM', { locale: ru })} – ${format(committed.to, 'd MMM', { locale: ru })}`
      : 'Выберите период'

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal h-9 px-3',
            !committed && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-[200] rounded-lg border bg-popover text-popover-foreground shadow-md p-3"
          align="start"
          sideOffset={4}
          avoidCollisions
        >
          <DayPicker
            mode="range"
            selected={displayed}
            onSelect={handleSelect}
            defaultMonth={displayed?.from}
            resetOnSelect
            modifiers={{
              single_start:
                selecting?.from && !selecting?.to ? [selecting.from] : [],
            }}
            modifiersClassNames={{
              single_start:
                'rounded-md [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-md [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
            }}
            locale={ru}
            showOutsideDays
            classNames={{
              root: 'rdp-custom',
              months: 'flex flex-col relative',
              month: 'space-y-3',
              month_caption: 'flex justify-center items-center h-7',
              caption_label: 'text-sm font-medium capitalize',
              nav: 'absolute inset-x-0 top-0 h-7 flex items-center justify-between pointer-events-none',
              button_previous:
                'pointer-events-auto h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground',
              button_next:
                'pointer-events-auto h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday:
                'text-muted-foreground w-9 text-center text-[0.75rem] font-normal',
              week: 'flex mt-1',
              day: 'relative h-9 w-9 p-0 text-center',
              day_button:
                'h-9 w-9 p-0 font-normal text-sm rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              // selected is empty — range_start/middle/end handle all coloring
              selected: '',
              today: '[&>button]:font-bold [&>button]:underline',
              range_start:
                'rounded-l-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-md [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
              range_middle: 'bg-accent rounded-none',
              range_end:
                'rounded-r-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-md [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
              outside: 'opacity-50',
              disabled: 'opacity-30 pointer-events-none',
              hidden: 'invisible',
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left' ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ),
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

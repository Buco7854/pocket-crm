import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { Task } from '@/types/models'

interface Props {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

const DAYS_SHORT_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PRIORITY_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  basse: 'success',
  moyenne: 'default',
  haute: 'warning',
  urgente: 'danger',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  // ISO week: Monday=0
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export default function TaskCalendar({ tasks, onTaskClick }: Props) {
  const { t, i18n } = useTranslation()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const daysShort = i18n.language === 'fr' ? DAYS_SHORT_FR : DAYS_SHORT_EN

  const monthName = new Date(year, month, 1).toLocaleString(i18n.language, { month: 'long', year: 'numeric' })

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  // Group tasks by day
  const tasksByDay = useMemo(() => {
    const map: Record<number, Task[]> = {}
    tasks.forEach((task) => {
      if (!task.due_date) return
      const d = new Date(task.due_date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(task)
      }
    })
    return map
  }, [tasks, year, month])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : -1

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <h3 className="text-sm font-semibold text-surface-900 capitalize">{monthName}</h3>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-900 transition-colors"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-surface-200">
        {daysShort.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-surface-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const dayTasks = day ? (tasksByDay[day] ?? []) : []
          const isToday = day === todayDay
          return (
            <div
              key={idx}
              className={`min-h-[90px] border-b border-r border-surface-100 p-1.5 ${
                !day ? 'bg-surface-50' : 'bg-surface-0'
              } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
            >
              {day && (
                <>
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-primary-600 text-white' : 'text-surface-500'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="w-full text-left truncate rounded px-1 py-0.5 text-xs hover:opacity-80 transition-opacity"
                        title={task.title}
                      >
                        <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'default'} size="sm">
                          <span className="truncate max-w-[80px] inline-block">{task.title}</span>
                        </Badge>
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="text-xs text-surface-400 px-1">
                        +{dayTasks.length - 3} {t('common.more', { defaultValue: 'more' })}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

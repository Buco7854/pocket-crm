import type { ReactNode } from 'react'

export interface TabItem<T extends string = string> {
  key: T
  label: string
  icon?: ReactNode
}

interface Props<T extends string> {
  tabs: TabItem<T>[]
  active: T
  onChange: (key: T) => void
}

export default function Tabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div className="flex gap-1 p-1 bg-surface-100 rounded-lg w-fit max-w-full overflow-x-auto shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            active === tab.key
              ? 'bg-surface-0 text-surface-900 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

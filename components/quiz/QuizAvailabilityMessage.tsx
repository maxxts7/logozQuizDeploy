"use client"

import { useSyncExternalStore } from "react"
import { Card } from "@/components/ui"
import { formatDateTime } from "@/lib/utils/timeFormatter"

interface QuizAvailabilityMessageProps {
  type: "notStarted" | "closed"
  dateISO: string
}

function subscribe() {
  return () => {}
}

function getSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

export default function QuizAvailabilityMessage({ type, dateISO }: QuizAvailabilityMessageProps) {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const dateDisplay = isClient ? formatDateTime(dateISO) : "..."

  if (type === "notStarted") {
    return (
      <Card padding="lg" className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Quiz Not Yet Available</h2>
        <p className="text-slate-600">
          This quiz will be available from{" "}
          <strong className="text-slate-900">{dateDisplay}</strong>
        </p>
      </Card>
    )
  }

  return (
    <Card padding="lg" className="text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Quiz Closed</h2>
      <p className="text-slate-600">
        This quiz closed on{" "}
        <strong className="text-slate-900">{dateDisplay}</strong>
      </p>
    </Card>
  )
}

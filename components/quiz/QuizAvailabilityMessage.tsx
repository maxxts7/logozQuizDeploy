"use client"

import { useState, useEffect } from "react"

interface QuizAvailabilityMessageProps {
  type: "notStarted" | "closed"
  dateISO: string
}

export default function QuizAvailabilityMessage({ type, dateISO }: QuizAvailabilityMessageProps) {
  const [formattedDate, setFormattedDate] = useState<string>("")

  useEffect(() => {
    setFormattedDate(new Date(dateISO).toLocaleString())
  }, [dateISO])

  const dateDisplay = formattedDate || "..."

  if (type === "notStarted") {
    return (
      <p className="text-gray-600">
        This quiz will be available from{" "}
        <strong>{dateDisplay}</strong>
      </p>
    )
  }

  return (
    <p className="text-gray-600">
      This quiz closed on{" "}
      <strong>{dateDisplay}</strong>
    </p>
  )
}

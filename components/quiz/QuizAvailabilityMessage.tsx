"use client"

interface QuizAvailabilityMessageProps {
  type: "notStarted" | "closed"
  dateISO: string
}

export default function QuizAvailabilityMessage({ type, dateISO }: QuizAvailabilityMessageProps) {
  // Format date in user's local timezone
  const formattedDate = new Date(dateISO).toLocaleString()

  if (type === "notStarted") {
    return (
      <p className="text-gray-600">
        This quiz will be available from{" "}
        <strong>{formattedDate}</strong>
      </p>
    )
  }

  return (
    <p className="text-gray-600">
      This quiz closed on{" "}
      <strong>{formattedDate}</strong>
    </p>
  )
}

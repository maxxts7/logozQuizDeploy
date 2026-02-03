"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Badge, Alert } from "@/components/ui"

interface IpAttempt {
  ipAddress: string
  attemptCount: number
  participantNames: string[]
}

interface IpAttemptsManagerProps {
  quizId: string
  ipAttempts: IpAttempt[]
  maxAttemptsPerIp: number | null
}

export default function IpAttemptsManager({
  quizId,
  ipAttempts,
  maxAttemptsPerIp,
}: IpAttemptsManagerProps) {
  const router = useRouter()
  const [resetting, setResetting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (ipAddress: string) => {
    if (!confirm(`Are you sure you want to reset all attempts from IP ${ipAddress}? This will delete their submission records.`)) {
      return
    }

    setResetting(ipAddress)
    setError(null)

    try {
      const response = await fetch(`/api/quiz/${quizId}/reset-ip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ipAddress }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to reset attempts")
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset attempts")
    } finally {
      setResetting(null)
    }
  }

  if (ipAttempts.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-slate-500">No IP attempt data available</p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mx-6 mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Participant
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Attempts
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ipAttempts.map((item) => {
              const isAtLimit = maxAttemptsPerIp && item.attemptCount >= maxAttemptsPerIp
              return (
                <tr key={item.ipAddress} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-700">
                    {item.ipAddress}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 max-w-xs">
                    {item.participantNames.length > 0
                      ? item.participantNames.join(", ")
                      : <span className="text-slate-400">Anonymous</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {item.attemptCount}
                    {maxAttemptsPerIp && (
                      <span className="text-slate-400"> / {maxAttemptsPerIp}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={isAtLimit ? "error" : "success"}>
                      {isAtLimit ? "Limit Reached" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      onClick={() => handleReset(item.ipAddress)}
                      disabled={resetting === item.ipAddress}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      isLoading={resetting === item.ipAddress}
                    >
                      {resetting === item.ipAddress ? "Resetting..." : "Reset"}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

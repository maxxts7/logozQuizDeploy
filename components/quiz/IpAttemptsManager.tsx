"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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
      <div className="px-6 py-8 text-center">
        <p className="text-gray-500">No IP attempt data available</p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attempts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ipAttempts.map((item) => {
              const isAtLimit = maxAttemptsPerIp && item.attemptCount >= maxAttemptsPerIp
              return (
                <tr key={item.ipAddress}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {item.ipAddress}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    {item.participantNames.length > 0
                      ? item.participantNames.join(", ")
                      : <span className="text-gray-400">Anonymous</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.attemptCount}
                    {maxAttemptsPerIp && (
                      <span className="text-gray-500"> / {maxAttemptsPerIp}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isAtLimit ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Limit Reached
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleReset(item.ipAddress)}
                      disabled={resetting === item.ipAddress}
                      className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetting === item.ipAddress ? "Resetting..." : "Reset"}
                    </button>
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

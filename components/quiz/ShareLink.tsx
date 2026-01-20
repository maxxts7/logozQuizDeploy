"use client"

import { useState } from "react"

export default function ShareLink({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <input
        type="text"
        value={shareUrl}
        readOnly
        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm min-w-0"
      />
      <div className="flex gap-2">
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 whitespace-nowrap shrink-0"
        >
          Open
        </a>
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 whitespace-nowrap shrink-0"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  )
}

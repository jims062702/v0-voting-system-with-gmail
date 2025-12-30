"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface VotingStatusToggleProps {
  status: {
    id: string
    is_open: boolean
  }
}

export function VotingStatusToggle({ status }: VotingStatusToggleProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleToggle = async () => {
    try {
      setLoading(true)
      setError(null)

      const newStatus = !status.is_open

      const { error: updateError } = await supabase
        .from("voting_status")
        .update({
          is_open: newStatus,
          start_time: newStatus ? new Date().toISOString() : null,
          end_time: newStatus ? null : new Date().toISOString(),
        })
        .eq("id", status.id)

      if (updateError) {
        setError(updateError.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update voting status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex gap-2 items-start">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <p className="font-medium text-gray-900">Current Status: {status.is_open ? "OPEN" : "CLOSED"}</p>
          <p className="text-sm text-gray-600 mt-1">
            {status.is_open
              ? "Voting is currently open. Users can vote."
              : "Voting is currently closed. Users cannot vote."}
          </p>
        </div>
        <Button
          onClick={handleToggle}
          disabled={loading}
          className={`${status.is_open ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white`}
        >
          {loading ? "Updating..." : status.is_open ? "Close Voting" : "Open Voting"}
        </Button>
      </div>
    </div>
  )
}

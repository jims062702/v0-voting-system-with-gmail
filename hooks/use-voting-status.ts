"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface VotingStatus {
  id: string
  is_open: boolean
  start_time: string | null
  end_time: string | null
}

export function useVotingStatus() {
  const [status, setStatus] = useState<VotingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchStatus = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase.from("voting_status").select("*").limit(1).single()

      if (fetchError) throw fetchError
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch voting status")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchStatus()

    // Subscribe to real-time updates using Supabase's RealtimeClient
    const subscription = supabase
      .channel("voting_status_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "voting_status",
        },
        (payload) => {
          console.log("[v0] Voting status updated:", payload)
          if (payload.new) {
            setStatus(payload.new as VotingStatus)
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Subscription status:", status)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchStatus])

  return { status, loading, error }
}

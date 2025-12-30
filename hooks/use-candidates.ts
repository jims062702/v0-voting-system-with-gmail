"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface Candidate {
  id: string
  name: string
  party_name: string
  is_independent: boolean
  description: string
  order_index: number
}

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCandidates = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase.from("candidates").select("*").order("order_index")

      if (fetchError) throw fetchError
      setCandidates(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch candidates")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCandidates()

    // Subscribe to real-time candidate updates
    const subscription = supabase
      .channel("candidates_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "candidates",
        },
        () => {
          console.log("[v0] Candidates updated, refetching...")
          fetchCandidates()
        },
      )
      .subscribe((status) => {
        console.log("[v0] Candidates subscription status:", status)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchCandidates])

  return { candidates, loading, error }
}

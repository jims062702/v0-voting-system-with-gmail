"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface UserVote {
  id: string
  user_id: string
  candidate_id: string
  created_at: string
}

export function useUserVote() {
  const [vote, setVote] = useState<UserVote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchUserVote = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setVote(null)
        return
      }

      const { data, error: fetchError } = await supabase.from("votes").select("*").eq("user_id", user.id).single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      setVote(data || null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user vote")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUserVote()

    // Subscribe to vote changes for current user
    const subscription = supabase
      .channel("user_votes_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
        },
        () => {
          console.log("[v0] User vote updated, refetching...")
          fetchUserVote()
        },
      )
      .subscribe((status) => {
        console.log("[v0] User vote subscription status:", status)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserVote])

  return { vote, loading, error }
}

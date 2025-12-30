"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CandidateResult {
  id: string
  name: string
  party_name: string
  is_independent: boolean
  vote_count: number
  percentage: number
}

export function VoteResults() {
  const [results, setResults] = useState<CandidateResult[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Fetch all candidates with their vote counts
        const { data: candidates } = await supabase.from("candidates").select("*").order("order_index")

        if (candidates) {
          // Fetch vote counts for each candidate
          const resultsPromises = candidates.map(async (candidate) => {
            const { count } = await supabase
              .from("votes")
              .select("*", { count: "exact", head: true })
              .eq("candidate_id", candidate.id)

            return {
              ...candidate,
              vote_count: count || 0,
            }
          })

          const candidatesWithVotes = await Promise.all(resultsPromises)

          // Calculate total votes
          const total = candidatesWithVotes.reduce((sum, c) => sum + c.vote_count, 0)
          setTotalVotes(total)

          // Calculate percentages
          const resultsWithPercentages = candidatesWithVotes.map((c) => ({
            ...c,
            percentage: total > 0 ? (c.vote_count / total) * 100 : 0,
          }))

          // Sort by vote count descending
          resultsWithPercentages.sort((a, b) => b.vote_count - a.vote_count)
          setResults(resultsWithPercentages)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchResults()

    // Subscribe to real-time vote updates
    const subscription = supabase
      .channel("votes")
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        fetchResults()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  if (loading) {
    return <div>Loading results...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Vote Results</CardTitle>
        <CardDescription>Real-time voting results ({totalVotes} total votes)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No votes yet</p>
          ) : (
            results.map((result) => (
              <div key={result.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{result.name}</p>
                    <p className="text-sm text-gray-600">{result.is_independent ? "Independent" : result.party_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{result.vote_count}</p>
                    <p className="text-sm text-gray-600">{result.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

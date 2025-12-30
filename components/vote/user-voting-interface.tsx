"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { VotingStatus } from "@/components/vote/voting-status"
import { CandidateCard } from "@/components/vote/candidate-card"
import { LogOut, AlertCircle } from "lucide-react"

interface Candidate {
  id: string
  name: string
  party_name: string
  is_independent: boolean
  description: string
}

interface VotingStatusData {
  id: string
  is_open: boolean
}

interface UserVote {
  candidate_id: string
}

export default function UserVotingInterface() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [votingStatus, setVotingStatus] = useState<VotingStatusData | null>(null)
  const [userVote, setUserVote] = useState<UserVote | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch candidates
        const { data: candidatesData } = await supabase.from("candidates").select("*").order("order_index")

        setCandidates(candidatesData || [])

        // Fetch voting status
        const { data: statusData } = await supabase.from("voting_status").select("*").limit(1).single()

        setVotingStatus(statusData)

        // Fetch user's existing vote
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: voteData } = await supabase.from("votes").select("*").eq("user_id", user.id).single()

          if (voteData) {
            setUserVote(voteData)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to real-time updates
    const statusSubscription = supabase
      .channel("voting_status")
      .on("postgres_changes", { event: "*", schema: "public", table: "voting_status" }, (payload) => {
        if (payload.new) {
          setVotingStatus(payload.new as VotingStatusData)
        }
      })
      .subscribe()

    const candidatesSubscription = supabase
      .channel("candidates")
      .on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, () => {
        // Refetch candidates on changes
        fetchData()
      })
      .subscribe()

    return () => {
      statusSubscription.unsubscribe()
      candidatesSubscription.unsubscribe()
    }
  }, [supabase])

  const handleVote = async (candidateId: string) => {
    try {
      setVoting(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("User not authenticated")
        return
      }

      // Check if user already voted
      if (userVote) {
        setError("You have already voted. Each user can only vote once.")
        return
      }

      // Insert vote
      const { error: insertError } = await supabase.from("votes").insert([
        {
          user_id: user.id,
          candidate_id: candidateId,
        },
      ])

      if (insertError) {
        if (insertError.code === "23505") {
          setError("You have already voted. Each user can only vote once.")
        } else {
          setError(insertError.message)
        }
        return
      }

      // Update local state
      setUserVote({ candidate_id: candidateId })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit vote")
    } finally {
      setVoting(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const canVote = votingStatus?.is_open && !userVote

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Cast Your Vote</h1>
            <p className="text-gray-600 mt-1">Select your preferred candidate</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Voting Status */}
        <VotingStatus status={votingStatus} userHasVoted={!!userVote} />

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {userVote && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Thank you! Your vote has been recorded successfully. You cannot change your vote.
            </AlertDescription>
          </Alert>
        )}

        {/* Candidates Section */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates</CardTitle>
            <CardDescription>Choose a candidate to vote for</CardDescription>
          </CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No candidates available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={userVote?.candidate_id === candidate.id}
                    isDisabled={!canVote || voting}
                    onVote={handleVote}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

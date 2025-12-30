"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VotingStatusToggle } from "@/components/admin/voting-status-toggle"
import { VoteResults } from "@/components/admin/vote-results"
import { LogOut, CheckCircle2, Clock } from "lucide-react"

interface VotingStatus {
  id: string
  is_open: boolean
  start_time: string | null
  end_time: string | null
}

export default function AdminDashboard() {
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null)
  const [totalVotes, setTotalVotes] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch voting status
        const { data: statusData } = await supabase.from("voting_status").select("*").limit(1).single()

        if (statusData) {
          setVotingStatus(statusData)
        }

        // Fetch total votes
        const { count: votesCount } = await supabase.from("votes").select("*", { count: "exact", head: true })

        setTotalVotes(votesCount || 0)

        // Fetch total users
        const { count: usersCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "user")

        setTotalUsers(usersCount || 0)
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
          setVotingStatus(payload.new as VotingStatus)
        }
      })
      .subscribe()

    const votesSubscription = supabase
      .channel("votes")
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, async () => {
        const { count } = await supabase.from("votes").select("*", { count: "exact", head: true })

        setTotalVotes(count || 0)
      })
      .subscribe()

    return () => {
      statusSubscription.unsubscribe()
      votesSubscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage voting session</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Voting Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {votingStatus?.is_open ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">OPEN</p>
                      <p className="text-xs text-gray-500">Voting in progress</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="text-2xl font-bold text-gray-400">CLOSED</p>
                      <p className="text-xs text-gray-500">Not active</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{totalVotes}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalUsers > 0 ? `${Math.round((totalVotes / totalUsers) * 100)}% participation` : "No users yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-indigo-600">{totalUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Eligible voters</p>
            </CardContent>
          </Card>
        </div>

        {/* Voting Control */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Voting Control</CardTitle>
            <CardDescription>Open or close the voting session</CardDescription>
          </CardHeader>
          <CardContent>{votingStatus && <VotingStatusToggle status={votingStatus} />}</CardContent>
        </Card>

        {/* Vote Results */}
        <VoteResults />
      </div>
    </div>
  )
}

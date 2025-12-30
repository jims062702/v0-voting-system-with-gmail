"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface VotingStatusProps {
  status: {
    is_open: boolean
  } | null
  userHasVoted: boolean
}

export function VotingStatus({ status, userHasVoted }: VotingStatusProps) {
  const [currentTime, setCurrentTime] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="mb-6 bg-white">
      <CardHeader>
        <CardTitle className="text-lg">Voting Session Status</CardTitle>
        <CardDescription>Current time: {currentTime}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Voting Open Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            {status?.is_open ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-700">Voting is Open</p>
                  <p className="text-sm text-gray-600">You can cast your vote now</p>
                </div>
              </>
            ) : (
              <>
                <Clock className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-700">Voting is Closed</p>
                  <p className="text-sm text-gray-600">Please wait for voting to open</p>
                </div>
              </>
            )}
          </div>

          {/* User Vote Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            {userHasVoted ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-700">You have voted</p>
                  <p className="text-sm text-gray-600">Your vote is securely recorded</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-700">You haven't voted yet</p>
                  <p className="text-sm text-gray-600">Select a candidate to vote</p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

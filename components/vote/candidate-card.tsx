"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, User } from "lucide-react"

interface Candidate {
  id: string
  name: string
  party_name: string
  is_independent: boolean
  description: string
}

interface CandidateCardProps {
  candidate: Candidate
  isSelected: boolean
  isDisabled: boolean
  onVote: (candidateId: string) => void
}

export function CandidateCard({ candidate, isSelected, isDisabled, onVote }: CandidateCardProps) {
  return (
    <Card
      className={`transition-all cursor-pointer ${
        isSelected ? "border-blue-500 bg-blue-50 shadow-lg" : "hover:shadow-md"
      } ${isDisabled && !isSelected ? "opacity-60" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{candidate.name}</h3>
              <p className="text-xs text-gray-600">{candidate.is_independent ? "Independent" : candidate.party_name}</p>
            </div>
          </div>
          {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
        </div>

        <p className="text-sm text-gray-700 mb-4 line-clamp-2">{candidate.description}</p>

        <Button
          onClick={() => onVote(candidate.id)}
          disabled={isDisabled}
          className={`w-full ${
            isSelected ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          } ${isDisabled && !isSelected ? "cursor-not-allowed" : ""}`}
        >
          {isSelected ? "Selected" : "Vote"}
        </Button>
      </CardContent>
    </Card>
  )
}

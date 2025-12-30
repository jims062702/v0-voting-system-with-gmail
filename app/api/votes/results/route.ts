import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get all candidates with vote counts
    const { data: candidates } = await supabase.from("candidates").select("*").order("order_index")

    if (!candidates) {
      return NextResponse.json([])
    }

    // Get vote counts for each candidate
    const resultsPromises = candidates.map(async (candidate) => {
      const { count } = await supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .eq("candidate_id", candidate.id)

      return {
        ...candidate,
        voteCount: count || 0,
      }
    })

    const results = await Promise.all(resultsPromises)

    // Calculate total votes
    const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0)

    // Add percentages
    const resultsWithPercentages = results.map((r) => ({
      ...r,
      percentage: totalVotes > 0 ? (r.voteCount / totalVotes) * 100 : 0,
    }))

    return NextResponse.json({
      candidates: resultsWithPercentages.sort((a, b) => b.voteCount - a.voteCount),
      totalVotes,
    })
  } catch (error) {
    console.error("Vote results error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

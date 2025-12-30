import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { candidateId } = await request.json()

    // Check if voting is open
    const { data: votingStatus } = await supabase.from("voting_status").select("is_open").limit(1).single()

    if (!votingStatus?.is_open) {
      return NextResponse.json({ error: "Voting is not open" }, { status: 400 })
    }

    // Check if user already voted
    const { data: existingVote } = await supabase.from("votes").select("*").eq("user_id", user.id).single()

    if (existingVote) {
      return NextResponse.json({ error: "User has already voted" }, { status: 400 })
    }

    // Validate candidate exists
    const { data: candidate } = await supabase.from("candidates").select("id").eq("id", candidateId).single()

    if (!candidate) {
      return NextResponse.json({ error: "Invalid candidate" }, { status: 400 })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Vote validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get voting status
    const { data: votingStatus } = await supabase.from("voting_status").select("*").limit(1).single()

    // Get total votes
    const { count: totalVotes } = await supabase.from("votes").select("*", { count: "exact", head: true })

    // Get total users (non-admin)
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "user")

    // Get vote participation rate
    const participationRate = totalUsers ? Math.round((totalVotes! / totalUsers) * 100) : 0

    return NextResponse.json({
      votingStatus,
      totalVotes,
      totalUsers,
      participationRate,
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: votingStatus } = await supabase.from("voting_status").select("*").limit(1).single()

    return NextResponse.json(votingStatus)
  } catch (error) {
    console.error("Voting status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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

    const { isOpen } = await request.json()

    const { data: updatedStatus } = await supabase
      .from("voting_status")
      .update({
        is_open: isOpen,
        start_time: isOpen ? new Date().toISOString() : null,
        end_time: isOpen ? null : new Date().toISOString(),
      })
      .eq("id", (await supabase.from("voting_status").select("id").limit(1).single()).data?.id)
      .select()
      .single()

    return NextResponse.json(updatedStatus)
  } catch (error) {
    console.error("Voting status update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

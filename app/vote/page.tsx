import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import UserVotingInterface from "@/components/vote/user-voting-interface"

export default async function VotePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Redirect admins to admin dashboard
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role === "admin") {
    redirect("/admin")
  }

  return <UserVotingInterface />
}

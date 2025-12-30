import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user data
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if user exists in users table, if not create
        const { data: existingUser } = await supabase.from("users").select("id").eq("id", user.id).single()

        if (!existingUser) {
          // Create user record with user role
          await supabase.from("users").insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
              role: "user",
            },
          ])
        }
      }

      return NextResponse.redirect(new URL("/vote", request.url))
    }
  }

  return NextResponse.redirect(new URL("/login", request.url))
}

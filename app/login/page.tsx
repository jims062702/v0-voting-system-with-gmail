"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGmailLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Voting System</CardTitle>
          <CardDescription>Sign in with your Gmail account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>}
          <Button
            onClick={handleGmailLogin}
            disabled={loading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5" />
            {loading ? "Signing in..." : "Sign in with Gmail"}
          </Button>
          <p className="text-xs text-center text-gray-500 mt-4">Your vote is secure and confidential</p>
        </CardContent>
      </Card>
    </div>
  )
}

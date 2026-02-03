"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AUTH_CONFIG } from "@/constants/quizConfig"
import { Button, Input, Label, Alert, Card, CardHeader, CardTitle, CardContent } from "@/components/ui"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <Card padding="lg">
        <CardHeader className="text-center mb-6">
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              QuizDesk
            </span>
          </Link>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <p className="text-sm text-slate-500 mt-2">
            Sign in to your account to continue
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={AUTH_CONFIG.MIN_PASSWORD_LENGTH}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="error">{error}</Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

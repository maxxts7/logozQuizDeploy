"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AUTH_CONFIG, VALIDATION_MESSAGES } from "@/constants/quizConfig"
import { Button, Input, Label, Alert, Card, CardHeader, CardTitle, CardContent } from "@/components/ui"

export default function RegisterForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
      setError(VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        return
      }

      router.push("/login?registered=true")
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <p className="text-sm text-slate-500 mt-2">
            Get started with QuizDesk in seconds
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={AUTH_CONFIG.MIN_PASSWORD_LENGTH}
                placeholder="Create a password"
                autoComplete="new-password"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Must be at least {AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={AUTH_CONFIG.MIN_PASSWORD_LENGTH}
                placeholder="Confirm your password"
                autoComplete="new-password"
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
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

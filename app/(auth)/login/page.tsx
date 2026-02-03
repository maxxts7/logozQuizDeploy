import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import LoginForm from "@/components/auth/LoginForm"

export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center py-12">
      <LoginForm />
    </div>
  )
}
